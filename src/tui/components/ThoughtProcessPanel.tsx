/**
 * ECHOMEN TUI Components - Thought Process Panel
 * Shows the plan and executed actions from the ReAct engine.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { CognitiveState } from '../../core/bdi-types.js';

interface ThoughtProcessPanelProps {
  currentState: CognitiveState;
  actions: string[];
  isProcessing: boolean;
}

export function ThoughtProcessPanel({ currentState, actions, isProcessing }: ThoughtProcessPanelProps) {
  const recentActions = actions.slice(-10).reverse();

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1} flexGrow={1}>
      <Text color="cyan" bold>Thought Process</Text>
      <Box marginY={1}>
        <Text color="gray" dimColor>State:</Text>
        <Text color="yellow"> {currentState}</Text>
        {isProcessing && <Text color="gray"> (running)</Text>}
      </Box>

      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {recentActions.length === 0 ? (
          <Text color="gray" dimColor>No actions executed yet.</Text>
        ) : (
          recentActions.map((action, idx) => (
            <Text key={`${action}-${idx}`} color="white" dimColor>
              • {action}
            </Text>
          ))
        )}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          (Shows last {recentActions.length} actions)
        </Text>
      </Box>
    </Box>
  );
}
