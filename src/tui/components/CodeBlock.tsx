/**
 * ECHOMEN TUI Components - Code Block
 * Syntax highlighted code display
 */

import React, { memo } from 'react';
import { Box, Text } from 'ink';
import { highlight } from 'cli-highlight';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

/**
 * Language mapping for syntax highlighting
 */
const LANG_MAP: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'jsx': 'javascript',
  'tsx': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'rs': 'rust',
  'go': 'go',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'cs': 'csharp',
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  'fish': 'fish',
  'json': 'json',
  'yaml': 'yaml',
  'yml': 'yaml',
  'toml': 'toml',
  'xml': 'xml',
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'sql': 'sql',
  'md': 'markdown',
  'markdown': 'markdown',
};

/**
 * CodeBlock component displays syntax highlighted code.
 * Optimized with React.memo to prevent unnecessary re-renders during streaming (Performance: Bolt ⚡)
 */
export const CodeBlock = memo(function CodeBlock({ code, language = 'text', showLineNumbers = false }: CodeBlockProps) {
  // Use cli-highlight for syntax highlighting
  const highlighted = highlight(code, {
    language: detectLanguage(language),
    ignoreIllegals: true,
  });
  
  const lines = highlighted.split('\n');
  
  return (
    <Box flexDirection="column" paddingX={1} borderStyle="single" borderColor="gray">
      {lines.map((line, index) => (
        <Box key={index}>
          {showLineNumbers && (
            <Box width={4}>
              <Text color="gray" dimColor>
                {String(index + 1).padStart(3, ' ')}{' '}
              </Text>
            </Box>
          )}
          <Text>{line}</Text>
        </Box>
      ))}
    </Box>
  );
});

/**
 * Detect language from code block marker
 * Optimized by moving langMap to module level to avoid re-allocation (Performance: Bolt ⚡)
 */
export function detectLanguage(marker: string): string {
  return LANG_MAP[marker.toLowerCase()] || marker;
}
