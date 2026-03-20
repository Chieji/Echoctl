/**
 * Universal Skill Registry & Sharing System
 * Enables sharing and synchronization of skills/plugins across platforms
 */

import { EventEmitter } from 'events';

export interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  tags: string[];
  source: 'echoctl' | 'mcp' | 'gemini' | 'qwen' | 'claude' | 'community';
  tools: Record<string, any>;
  dependencies?: string[];
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface SkillRegistry {
  id: string;
  name: string;
  url: string;
  description: string;
  type: 'local' | 'remote' | 'community';
}

class UniversalSkillRegistry extends EventEmitter {
  private skills: Map<string, Skill> = new Map();
  private registries: Map<string, SkillRegistry> = new Map();
  private skillIndex: Map<string, string[]> = new Map(); // Tag -> Skill IDs
  private syncStatus: Map<string, { lastSync: number; status: 'syncing' | 'synced' | 'failed' }> =
    new Map();

  constructor() {
    super();
    this.initializeDefaultRegistries();
  }

  /**
   * Initialize default registries
   */
  private initializeDefaultRegistries() {
    this.registerRegistry({
      id: 'echoctl-official',
      name: 'Echoctl Official Registry',
      url: 'https://registry.echoctl.dev',
      description: 'Official Echoctl skills and plugins',
      type: 'remote',
    });

    this.registerRegistry({
      id: 'mcp-registry',
      name: 'MCP Registry',
      url: 'https://registry.modelcontextprotocol.io',
      description: 'Model Context Protocol compatible tools',
      type: 'remote',
    });

    this.registerRegistry({
      id: 'community-skills',
      name: 'Community Skills',
      url: 'https://community.echoctl.dev/skills',
      description: 'Community-contributed skills',
      type: 'community',
    });

    console.log('✓ Universal Skill Registry initialized');
  }

  /**
   * Register a new skill
   */
  registerSkill(skill: Skill): void {
    this.skills.set(skill.id, skill);

    // Index by tags
    for (const tag of skill.tags) {
      if (!this.skillIndex.has(tag)) {
        this.skillIndex.set(tag, []);
      }
      this.skillIndex.get(tag)!.push(skill.id);
    }

    this.emit('skill:registered', skill);
    console.log(`✓ Skill registered: ${skill.name}@${skill.version}`);
  }

  /**
   * Register a skill registry
   */
  registerRegistry(registry: SkillRegistry): void {
    this.registries.set(registry.id, registry);
    this.syncStatus.set(registry.id, { lastSync: 0, status: 'synced' });
    this.emit('registry:registered', registry);
    console.log(`✓ Registry registered: ${registry.name}`);
  }

  /**
   * Get skill by ID
   */
  getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  /**
   * Search skills by tag
   */
  searchByTag(tag: string): Skill[] {
    const skillIds = this.skillIndex.get(tag) || [];
    return skillIds.map((id) => this.skills.get(id)!).filter(Boolean);
  }

  /**
   * Search skills by name
   */
  searchByName(query: string): Skill[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.skills.values()).filter((skill) =>
      skill.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Search skills by source
   */
  searchBySource(source: string): Skill[] {
    return Array.from(this.skills.values()).filter((skill) => skill.source === source);
  }

  /**
   * Get all skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get skills by registry
   */
  getSkillsByRegistry(registryId: string): Skill[] {
    return Array.from(this.skills.values()).filter((skill) => {
      // Skills from this registry would have metadata linking them
      return skill.metadata?.registryId === registryId;
    });
  }

  /**
   * Sync skills from a registry
   */
  async syncRegistry(registryId: string): Promise<Skill[]> {
    const registry = this.registries.get(registryId);

    if (!registry) {
      throw new Error(`Registry not found: ${registryId}`);
    }

    this.syncStatus.set(registryId, { lastSync: Date.now(), status: 'syncing' });
    this.emit('registry:syncing', registryId);

    try {
      // Simulate fetching skills from registry
      const skills = await this.fetchSkillsFromRegistry(registry);

      for (const skill of skills) {
        skill.metadata = { ...skill.metadata, registryId };
        this.registerSkill(skill);
      }

      this.syncStatus.set(registryId, { lastSync: Date.now(), status: 'synced' });
      this.emit('registry:synced', { registryId, count: skills.length });

      console.log(`✓ Synced ${skills.length} skills from ${registry.name}`);

      return skills;
    } catch (error: any) {
      this.syncStatus.set(registryId, { lastSync: Date.now(), status: 'failed' });
      this.emit('registry:sync-failed', { registryId, error: error.message });

      console.error(`✗ Failed to sync ${registry.name}:`, error.message);

      return [];
    }
  }

  /**
   * Sync all registries
   */
  async syncAllRegistries(): Promise<void> {
    console.log('🔄 Syncing all registries...');

    const registryIds = Array.from(this.registries.keys());

    for (const registryId of registryIds) {
      await this.syncRegistry(registryId);
    }

    console.log('✓ All registries synced');
  }

  /**
   * Fetch skills from registry (placeholder)
   */
  private async fetchSkillsFromRegistry(registry: SkillRegistry): Promise<Skill[]> {
    // In production, this would make HTTP requests to the registry
    // For now, return empty array
    return [];
  }

  /**
   * Share skill to registry
   */
  async shareSkill(skillId: string, registryId: string): Promise<boolean> {
    const skill = this.skills.get(skillId);

    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    const registry = this.registries.get(registryId);

    if (!registry) {
      throw new Error(`Registry not found: ${registryId}`);
    }

    try {
      // Upload skill to registry
      await this.uploadSkillToRegistry(skill, registry);

      this.emit('skill:shared', { skillId, registryId });
      console.log(`✓ Skill shared: ${skill.name} → ${registry.name}`);

      return true;
    } catch (error: any) {
      this.emit('skill:share-failed', { skillId, registryId, error: error.message });

      console.error(`✗ Failed to share skill:`, error.message);

      return false;
    }
  }

  /**
   * Upload skill to registry (placeholder)
   */
  private async uploadSkillToRegistry(skill: Skill, registry: SkillRegistry): Promise<void> {
    // In production, this would make HTTP POST requests
    // For now, just simulate
    console.log(`Uploading ${skill.name} to ${registry.name}...`);
  }

  /**
   * Export skill as portable package
   */
  exportSkill(skillId: string): Record<string, any> {
    const skill = this.skills.get(skillId);

    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    return {
      skill,
      exportedAt: new Date().toISOString(),
      format: 'echoctl-skill-v1',
    };
  }

  /**
   * Import skill from package
   */
  importSkill(skillPackage: Record<string, any>): Skill {
    if (skillPackage.format !== 'echoctl-skill-v1') {
      throw new Error('Invalid skill package format');
    }

    const skill = skillPackage.skill;

    // Validate skill structure
    if (!skill.id || !skill.name || !skill.version) {
      throw new Error('Invalid skill structure');
    }

    this.registerSkill(skill);

    return skill;
  }

  /**
   * Get registry sync status
   */
  getSyncStatus(registryId?: string) {
    if (registryId) {
      return this.syncStatus.get(registryId);
    }

    return Object.fromEntries(this.syncStatus);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalSkills: this.skills.size,
      totalRegistries: this.registries.size,
      skillsBySource: this.getSkillsBySourceStats(),
      topTags: this.getTopTags(10),
    };
  }

  /**
   * Get skills by source statistics
   */
  private getSkillsBySourceStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const skill of this.skills.values()) {
      stats[skill.source] = (stats[skill.source] || 0) + 1;
    }

    return stats;
  }

  /**
   * Get top tags
   */
  private getTopTags(limit: number): Array<{ tag: string; count: number }> {
    return Array.from(this.skillIndex.entries())
      .map(([tag, ids]) => ({ tag, count: ids.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Create a skill collection
   */
  createCollection(
    name: string,
    skillIds: string[]
  ): { id: string; name: string; skills: Skill[] } {
    const skills = skillIds.map((id) => this.skills.get(id)!).filter(Boolean);

    return {
      id: `collection-${Date.now()}`,
      name,
      skills,
    };
  }

  /**
   * Recommend skills based on installed skills
   */
  recommendSkills(installedSkillIds: string[], limit: number = 5): Skill[] {
    const installedSkills = installedSkillIds.map((id) => this.skills.get(id)!).filter(Boolean);

    // Collect tags from installed skills
    const installedTags = new Set<string>();
    for (const skill of installedSkills) {
      skill.tags.forEach((tag) => installedTags.add(tag));
    }

    // Find skills with similar tags
    const recommendations = new Map<string, number>();

    for (const tag of installedTags) {
      const skillIds = this.skillIndex.get(tag) || [];

      for (const skillId of skillIds) {
        if (!installedSkillIds.includes(skillId)) {
          recommendations.set(skillId, (recommendations.get(skillId) || 0) + 1);
        }
      }
    }

    // Sort by recommendation score
    return Array.from(recommendations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([skillId]) => this.skills.get(skillId)!)
      .filter(Boolean);
  }
}

export const universalSkillRegistry = new UniversalSkillRegistry();
