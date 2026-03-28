/**
 * Claude Skill Importer
 * 
 * Imports skills from Claude Desktop / Claude Code CLI
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { getExtensionRegistry, type Extension } from '../extensions/registry.js';

/**
 * Claude skill format
 */
interface ClaudeSkill {
  name: string;
  description?: string;
  promptTemplate?: string;
  tools?: string[];
  instructions?: string;
}

/**
 * Claude config format
 */
interface ClaudeConfig {
  skills?: ClaudeSkill[];
  customSkills?: ClaudeSkill[];
}

/**
 * Known Claude config paths
 */
const CLAUDE_CONFIG_PATHS = [
  join(homedir(), '.claude.json'),
  join(homedir(), '.config', 'claude', 'skills.json'),
  join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'),
];

/**
 * Import skills from Claude
 */
export async function importClaudeSkills(): Promise<number> {
  const registry = getExtensionRegistry();
  let importedCount = 0;
  
  console.log(chalk.cyan('\n🔍 Searching for Claude skills...\n'));
  
  // Find Claude config
  let claudeConfig: ClaudeConfig | null = null;
  let configPath: string | null = null;
  
  for (const path of CLAUDE_CONFIG_PATHS) {
    if (existsSync(path)) {
      try {
        const content = await readFile(path, 'utf-8');
        claudeConfig = JSON.parse(content);
        configPath = path;
        console.log(chalk.dim(`Found Claude config: ${path}`));
        break;
      } catch (error: any) {
        console.log(chalk.dim(`Failed to read ${path}: ${error.message}`));
      }
    }
  }
  
  if (!claudeConfig || !configPath) {
    console.log(chalk.yellow('⚠ No Claude skills found\n'));
    return 0;
  }
  
  // Get skills from config
  const skills = [...(claudeConfig.skills || []), ...(claudeConfig.customSkills || [])];
  
  if (skills.length === 0) {
    console.log(chalk.yellow('⚠ No skills defined in Claude config\n'));
    return 0;
  }
  
  console.log(chalk.green(`Found ${skills.length} Claude skill(s)\n`));
  
  // Import each skill
  for (const skill of skills) {
    try {
      const extensionId = `claude-${skill.name}`;
      
      // Skip if already exists
      if (registry.get(extensionId)) {
        console.log(chalk.dim(`  ⊘ Skipping ${skill.name} (already exists)`));
        continue;
      }
      
      // Create extension
      const extension: Extension = {
        id: extensionId,
        name: skill.name,
        description: skill.description || `Claude skill: ${skill.name}`,
        source: 'skill',
        enabled: true,
        skillConfig: {
          ecosystem: 'claude',
          promptTemplate: skill.promptTemplate || skill.instructions,
        },
        invoke: async (args) => {
          // Claude skills are prompt templates - return formatted prompt
          const template = skill.promptTemplate || skill.instructions || '';
          return {
            prompt: template,
            variables: args,
            source: 'claude',
          };
        },
      };
      
      // Register
      await registry.register(extension);
      importedCount++;
      
      console.log(chalk.dim(`  ✓ Imported: ${skill.name}`));
      
    } catch (error: any) {
      console.log(chalk.red(`  ✗ Failed to import ${skill.name}: ${error.message}`));
    }
  }
  
  console.log(chalk.green(`\n✓ Imported ${importedCount} Claude skill(s)\n`));
  
  return importedCount;
}

/**
 * Add Claude sync to extension sync command
 */
export async function syncClaudeSkills(): Promise<void> {
  const count = await importClaudeSkills();
  
  if (count > 0) {
    console.log(chalk.green(`✓ Claude skill sync complete: ${count} skill(s) imported\n`));
  } else {
    console.log(chalk.yellow('⚠ No Claude skills to sync\n'));
  }
}
