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
 * Detect language from code block marker
 */
export function detectLanguage(marker: string): string {
  return LANG_MAP[marker.toLowerCase()] || marker;
}

export const CodeBlock = React.memo(({ code, language = 'text', showLineNumbers = false }: CodeBlockProps) => {
  // Performance: Memoize syntax highlighting to prevent redundant work during re-renders (Bolt ⚡)
  const highlighted = useMemo(() => {
    return highlight(code, {
      language: detectLanguage(language),
      ignoreIllegals: true,
    });
  }, [code, language]);
  
  const lines = useMemo(() => highlighted.split('\n'), [highlighted]);
  
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
