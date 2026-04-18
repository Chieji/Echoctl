import { highlight } from 'cli-highlight';

/**
 * Regex to match markdown code blocks
 * e.g. ```typescript\n const x = 1; \n```
 */
const CODE_BLOCK_REGEX = /```([\w-]+)?\n([\s\S]*?)```/g;

/**
 * Parses markdown text, extracts code blocks wrapped in triple backticks,
 * and applies cli-highlight with terminal colors.
 */
export function highlightMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return text;

  return text.replace(CODE_BLOCK_REGEX, (match, language, code) => {
    try {
      const highlighted = highlight(code, {
        language: language || 'typescript',
        ignoreIllegals: true,
      });
      return `\`\`\`${language || ''}\n${highlighted}\`\`\``;
    } catch {
      // If highlighter fails, return exactly what was there
      return match;
    }
  });
}
