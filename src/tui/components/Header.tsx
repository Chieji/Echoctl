/**
 * ECHOMEN TUI Components - Header
 * Displays the ECHO logo and mode indicator
 */

import React from 'react';
import { Box, Text } from 'ink';
import { ViewMode } from '../types.js';

interface HeaderProps {
  mode: ViewMode;
}

const MODE_LABELS: Record<ViewMode, { label: string; color: string }> = {
  chat: { label: 'CHAT', color: 'blue' },
  agent: { label: 'AGENT', color: 'green' },
  code: { label: 'CODE', color: 'magenta' },
  browser: { label: 'BROWSER', color: 'cyan' },
  memory: { label: 'MEMORY', color: 'yellow' },
};

export function Header({ mode }: HeaderProps) {
  const modeInfo = MODE_LABELS[mode];

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1}>
      {/* Logo */}
      <Box justifyContent="center" marginBottom={1}>
        <Text color="cyan" bold>
          ╔═══════════════════════════════════════════╗
        </Text>
      </Box>
      <Box justifyContent="center">
        <Text color="cyan" bold>
          ║     E C H O     ║  v2.0  ║  Neural Agent ║
        </Text>
      </Box>
      <Box justifyContent="center" marginTop={1}>
        <Text color="cyan" bold>
          ╚═══════════════════════════════════════════╝
        </Text>
      </Box>

      {/* Mode indicator */}
      <Box marginTop={1} justifyContent="center">
        <Text color="gray">Mode: </Text>
        <Text color={modeInfo.color} bold>
          {modeInfo.label}
        </Text>
      </Box>
    </Box>
  );
}
