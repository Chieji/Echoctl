/**
 * ECHOMEN TUI Components - StatusBar
 * Shows system status, provider health, and shortcuts
 */

import React from 'react';
import { Box, Text } from 'ink';
import { ViewMode } from '../types.js';
import { CognitiveState } from '../../core/bdi-types.js';

interface StatusBarProps {
  mode: ViewMode;
  isProcessing: boolean;
  messageCount: number;
  cognitiveState?: CognitiveState;
}

// State colors for visual indication
const STATE_COLORS: Record<CognitiveState, string> = {
  IDLE: 'gray',
  PERCEIVE: 'cyan',
  REASON: 'blue',
  PLAN: 'magenta',
  ACT: 'yellow',
  OBSERVE: 'green',
  REFLECT: 'cyan',
  LEARN: 'magenta',
};

// State icons
const STATE_ICONS: Record<CognitiveState, string> = {
  IDLE: '○',
  PERCEIVE: '◉',
  REASON: '◉',
  PLAN: '◉',
  ACT: '◉',
  OBSERVE: '◉',
  REFLECT: '◉',
  LEARN: '◉',
};

// State descriptions
const STATE_DESCRIPTIONS: Record<CognitiveState, string> = {
  IDLE: 'Ready',
  PERCEIVE: 'Sensing',
  REASON: 'Thinking',
  PLAN: 'Planning',
  ACT: 'Acting',
  OBSERVE: 'Observing',
  REFLECT: 'Reflecting',
  LEARN: 'Learning',
};

export function StatusBar({ mode, isProcessing, messageCount, cognitiveState = 'IDLE' }: StatusBarProps) {
  const stateColor = STATE_COLORS[cognitiveState] as any;
  const stateIcon = STATE_ICONS[cognitiveState];
  const stateDesc = STATE_DESCRIPTIONS[cognitiveState];

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

      {/* Center: Cognitive State with visual indicator */}
      <Box>
        <Text color="gray">BDI: </Text>
        <Text color={stateColor} bold>
          {stateIcon} {cognitiveState}
        </Text>
        <Text color="gray"> ({stateDesc})</Text>
      </Box>

      {/* Right: Shortcuts */}
      <Box>
        <Text color="gray" dimColor>
          [Ctrl+1: Chat] [Ctrl+2: Agent] [Ctrl+3: Code] [Ctrl+4: Browser] [Ctrl+5: Memory]
        </Text>
      </Box>
    </Box>
  );
}
