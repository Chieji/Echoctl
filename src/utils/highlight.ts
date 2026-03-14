import { highlight } from 'cli-highlight';

/**
 * Parses markdown text, extracts code blocks wrapped in triple backticks,
 * and applies cli-highlight with terminal colors.
 */
export function highlightMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // Regex to match markdown code blocks
  // e.g. ```typescript\n const x = 1; \n```
  const codeBlockRegex = /```([\w-]+)?\n([\s\S]*?)```/g;

  return text.replace(codeBlockRegex, (match, language, code) => {
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
