/**
 * Smart Mode - Intelligent provider selection based on task type
 */

import { ProviderName, TaskType } from '../types/index.js';

/**
 * Keywords that indicate task type
 */
const TASK_KEYWORDS: Record<TaskType, string[]> = {
  code: [
    'code',
    'function',
    'class',
    'variable',
    'loop',
    'array',
    'object',
    'api',
    'endpoint',
    'database',
    'sql',
    'query',
    'debug',
    'error',
    'bug',
    'fix',
    'implement',
    'algorithm',
    'data structure',
    'typescript',
    'javascript',
    'python',
    'java',
    'rust',
    'go',
    'react',
    'node',
    'server',
    'backend',
    'frontend',
    'deploy',
    'docker',
    'kubernetes',
    'git',
    'commit',
    'branch',
    'merge',
    'pull request',
  ],
  creative: [
    'write',
    'story',
    'poem',
    'song',
    'script',
    'blog',
    'article',
    'essay',
    'creative',
    'imagine',
    'fiction',
    'character',
    'plot',
    'worldbuilding',
    'brainstorm',
    'ideas',
    'marketing',
    'copy',
    'slogan',
    'name',
    'brand',
    'long',
    'detailed',
    'comprehensive',
  ],
  nuance: [
    'ethical',
    'moral',
    'philosophy',
    'opinion',
    'advice',
    'counsel',
    'therapy',
    'mental health',
    'sensitive',
    'controversial',
    'bias',
    'fairness',
    'justice',
    'empathy',
    'emotion',
    'feelings',
    'relationship',
    'conflict',
    'mediation',
    'nuanced',
    'subtle',
  ],
  general: [
    // Default catch-all
  ],
};

/**
 * Best provider for each task type
 */
const PROVIDER_FOR_TASK: Record<TaskType, ProviderName> = {
  code: 'groq',         // Fast inference for code
  creative: 'openrouter', // Access to best creative models
  nuance: 'anthropic',  // Best for ethical considerations
  general: 'gemini',    // Default to Gemini for general tasks
};

/**
 * Classify a task based on its content
 */
export function classifyTask(input: string): TaskType {
  const lowerInput = input.toLowerCase();
  
  const scores: Record<TaskType, number> = {
    code: 0,
    creative: 0,
    nuance: 0,
    general: 0,
  };

  // Count keyword matches for each category
  for (const [taskType, keywords] of Object.entries(TASK_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword)) {
        scores[taskType as TaskType]++;
      }
    }
  }

  // Find the highest scoring category
  let maxScore = 0;
  let classified: TaskType = 'general';

  for (const [taskType, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      classified = taskType as TaskType;
    }
  }

  // If no keywords matched, it's general
  if (maxScore === 0) {
    return 'general';
  }

  return classified;
}

/**
 * Select the best provider for a task
 */
export function selectProviderForTask(input: string): ProviderName {
  const taskType = classifyTask(input);
  return PROVIDER_FOR_TASK[taskType];
}

/**
 * Get explanation for why a provider was selected
 */
export function getProviderSelectionReason(input: string): string {
  const taskType = classifyTask(input);
  const provider = PROVIDER_FOR_TASK[taskType];

  const reasons: Record<TaskType, string> = {
    code: 'Code/logic task detected → Using Groq (fastest inference)',
    creative: 'Creative/long-form task detected → Using OpenRouter (best model selection)',
    nuance: 'Nuanced/ethical task detected → Using Claude (best for sensitive topics)',
    general: 'General task → Using default provider (Gemini)',
  };

  return reasons[taskType];
}

/**
 * Detect if input contains code snippets
 */
export function containsCode(input: string): boolean {
  // Check for code blocks
  if (input.includes('```') || input.includes('function ') || input.includes('const ') || 
      input.includes('def ') || input.includes('class ') || input.includes('import ') ||
      input.includes('return ') || input.includes('=>') || input.includes('{') && input.includes('}')) {
    return true;
  }
  
  // Check for common programming patterns
  const codePatterns = [
    /\b(function|const|let|var|def|class|import|from|return|if|else|for|while)\b/,
    /[{}]\s*$/m,
    /=>\s*{/,
    /\.\w+\(/,
  ];
  
  return codePatterns.some(pattern => pattern.test(input));
}
