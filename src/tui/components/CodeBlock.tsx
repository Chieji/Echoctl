/**
 * ECHOMEN TUI Components - Code Block
 * Syntax highlighted code display
 */

import React from 'react';
import { Box, Text } from 'ink';
import { highlight } from 'cli-highlight';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language = 'text', showLineNumbers = false }: CodeBlockProps) {
  // For now, display code with basic formatting
  // cli-highlight works better in full terminal, so we'll adapt for Ink
  
  const lines = code.split('\n');
  
  return (
    <Box flexDirection="column">
      {lines.map((line, index) => (
        <Box key={index}>
          {showLineNumbers && (
            <Text color="gray" dimColor>
              {String(index + 1).padStart(3, ' ')}{' '}
            </Text>
          )}
          <Text>{line}</Text>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Detect language from code block marker
 */
export function detectLanguage(marker: string): string {
  const langMap: Record<string, string> = {
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
  
  return langMap[marker.toLowerCase()] || marker;
}
