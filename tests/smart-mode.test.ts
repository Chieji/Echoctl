/**
 * Tests for Smart Mode Task Classifier
 */

import { describe, it, expect } from '@jest/globals';
import { classifyTask, selectProviderForTask, getProviderSelectionReason, containsCode } from '../src/utils/smart-mode.js';

describe('Smart Mode - Task Classification', () => {
  describe('classifyTask', () => {
    it('should classify code-related tasks', () => {
      expect(classifyTask('Fix the bug in my function')).toBe('code');
      expect(classifyTask('Write a Python script')).toBe('code');
      expect(classifyTask('Debug this error')).toBe('code');
      expect(classifyTask('Implement a new feature')).toBe('code');
    });

    it('should classify creative tasks', () => {
      expect(classifyTask('Write a poem')).toBe('creative');
      expect(classifyTask('Create a story')).toBe('creative');
      expect(classifyTask('Brainstorm ideas')).toBe('creative');
      expect(classifyTask('Write a blog post')).toBe('creative');
    });

    it('should classify nuanced tasks', () => {
      expect(classifyTask('What is the ethical thing to do')).toBe('nuance');
      expect(classifyTask('Give me advice on relationships')).toBe('nuance');
      expect(classifyTask('Discuss the philosophy')).toBe('nuance');
    });

    it('should classify general tasks as general', () => {
      expect(classifyTask('What is the weather')).toBe('general');
      expect(classifyTask('Hello')).toBe('general');
      expect(classifyTask('Tell me something')).toBe('general');
    });

    it('should handle mixed keywords', () => {
      // Code keywords should dominate
      const result = classifyTask('Write code for a story generator');
      expect(result).toBe('code');
    });
  });

  describe('selectProviderForTask', () => {
    it('should select Groq for code tasks', () => {
      expect(selectProviderForTask('Fix this bug')).toBe('groq');
    });

    it('should select OpenRouter for creative tasks', () => {
      expect(selectProviderForTask('Write a poem')).toBe('openrouter');
    });

    it('should select Anthropic for nuanced tasks', () => {
      expect(selectProviderForTask('Ethical dilemma')).toBe('anthropic');
    });

    it('should select Gemini for general tasks', () => {
      expect(selectProviderForTask('Hello')).toBe('gemini');
    });
  });

  describe('getProviderSelectionReason', () => {
    it('should explain code task selection', () => {
      const reason = getProviderSelectionReason('Debug this');
      expect(reason).toContain('Code/logic');
      expect(reason).toContain('Groq');
    });

    it('should explain creative task selection', () => {
      const reason = getProviderSelectionReason('Write a story');
      expect(reason).toContain('Creative');
      expect(reason).toContain('OpenRouter');
    });

    it('should explain nuanced task selection', () => {
      const reason = getProviderSelectionReason('Ethics');
      expect(reason).toContain('Nuanced');
      expect(reason).toContain('Claude');
    });

    it('should explain general task selection', () => {
      const reason = getProviderSelectionReason('Hello');
      expect(reason).toContain('General');
      expect(reason).toContain('Gemini');
    });
  });

  describe('containsCode', () => {
    it('should detect code blocks', () => {
      expect(containsCode('```typescript\nconst x = 1;\n```')).toBe(true);
    });

    it('should detect function declarations', () => {
      expect(containsCode('function test() {}')).toBe(true);
      expect(containsCode('def test():')).toBe(true);
    });

    it('should detect class declarations', () => {
      expect(containsCode('class MyClass {}')).toBe(true);
    });

    it('should detect const/let/var', () => {
      expect(containsCode('const x = 1')).toBe(true);
      expect(containsCode('let y = 2')).toBe(true);
    });

    it('should detect arrow functions', () => {
      expect(containsCode('x => x + 1')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(containsCode('Hello, how are you?')).toBe(false);
      expect(containsCode('The weather is nice')).toBe(false);
    });
  });
});
