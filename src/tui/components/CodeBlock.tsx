/**
 * ECHOMEN TUI Components - Code Block
 * Syntax highlighted code display
 */

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { highlight } from 'cli-highlight';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

/**
 * Language mapping for common extensions (moved outside component to avoid re-allocation)
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
 * ECHOMEN TUI Components - Code Block
 * Syntax highlighted code display
 * Performance: Optimized with React.memo and useMemo to prevent expensive re-highlighting (Bolt ⚡)
 */
export const CodeBlock = React.memo(({ code, language = 'text', showLineNumbers = false }: CodeBlockProps) => {
  // Memoize highlighted code to avoid re-running cli-highlight on every render
  // This is critical during AI streaming where the parent re-renders frequently.
  const lines = useMemo(() => {
    const highlighted = highlight(code, {
      language: detectLanguage(language),
      ignoreIllegals: true,
    });
    return highlighted.split('\n');
  }, [code, language]);
  
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
 */
export function detectLanguage(marker: string): string {
  return LANG_MAP[marker.toLowerCase()] || marker;
}
