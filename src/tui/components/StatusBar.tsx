/**
 * ECHOMEN TUI Components - StatusBar
 * Shows system status, provider health, and shortcuts
 */

import React from 'react';
import { Box, Text } from 'ink';
import { ViewMode } from '../types.js';
import { useCognitiveState } from '../../hooks/useEngine.js';

interface StatusBarProps {
  mode: ViewMode;
  isProcessing: boolean;
  messageCount: number;
}

export function StatusBar({ mode, isProcessing, messageCount }: StatusBarProps) {
  const state = useCognitiveState();

  return (
    <Box
      flexDirection="row"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      justifyContent="space-between"
    >
      {/* Left: Status */}
      <Box>
        <Text color={isProcessing ? 'yellow' : 'green'}>
          {isProcessing ? '⟳ Processing...' : '● Ready'}
        </Text>
        <Text color="gray">  |  </Text>
        <Text color="cyan">Messages: {messageCount}</Text>
      </Box>

      {/* Center: State */}
      <Box>
        <Text color="gray">State: </Text>
        <Text color="white">{state}</Text>
      </Box>

      {/* Right: Shortcuts */}
      <Box>
        <Text color="gray" dimColor>
          [Ctrl+C: Chat] [Ctrl+A: Agent] [Ctrl+F: Code] [Ctrl+B: Browser] [Ctrl+M: Memory]
        </Text>
      </Box>
    </Box>
  );
}
