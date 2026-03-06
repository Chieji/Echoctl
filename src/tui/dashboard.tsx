/**
 * Echo TUI Dashboard
 * Real-time terminal dashboard using Ink (React for CLI)
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import gradient from 'gradient-string';

interface DashboardProps {
  providers: Array<{ name: string; configured: boolean }>;
  sessions: number;
  tokens: number;
  lastActivity: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  providers,
  sessions,
  tokens,
  lastActivity,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q' || input === 'Q' || key.escape) {
      exit();
    }
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ╔═══════════════════════════════════════════════════════════╗
        </Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ║
        </Text>
        <Text bold color="white">
          {' '}ECHO DASHBOARD - The Resilient Agentic Terminal{' '}
        </Text>
        <Text bold color="cyan">
          ║
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text bold color="cyan">
          ╚═══════════════════════════════════════════════════════════╝
        </Text>
      </Box>

      {/* Time & Status */}
      <Box marginBottom={1} flexDirection="column">
        <Box>
          <Text color="gray">Time: </Text>
          <Text color="white">{formatTime(currentTime)}</Text>
          <Text color="gray">  |  </Text>
          <Text color="white">{formatDate(currentTime)}</Text>
        </Box>
        <Box>
          <Text color="gray">Status: </Text>
          <Text color="green">● Online</Text>
          <Text color="gray">  |  </Text>
          <Text color="yellow">
            <Spinner type="dots" />
          </Text>
          <Text color="gray"> Listening for commands</Text>
        </Box>
      </Box>

      {/* Provider Status */}
      <Box marginBottom={1} flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">Provider Status</Text>
        <Box marginTop={1} flexDirection="column">
          {providers.map((provider, index) => (
            <Box key={provider.name}>
              <Text color={provider.configured ? 'green' : 'gray'}>
                {provider.configured ? '●' : '○'} {provider.name}
              </Text>
              {index < providers.length - 1 && <Text color="gray">  |  </Text>}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Stats */}
      <Box marginBottom={1} flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={1}>
        <Text bold color="magenta">Statistics</Text>
        <Box marginTop={1}>
          <Box marginRight={3}>
            <Text color="gray">Sessions: </Text>
            <Text color="white">{sessions}</Text>
          </Box>
          <Box marginRight={3}>
            <Text color="gray">Tokens Used: </Text>
            <Text color="white">{tokens.toLocaleString()}</Text>
          </Box>
          <Box>
            <Text color="gray">Last Activity: </Text>
            <Text color="white">{lastActivity}</Text>
          </Box>
        </Box>
      </Box>

      {/* Quick Commands */}
      <Box marginBottom={1} flexDirection="column" borderStyle="round" borderColor="green" paddingX={1}>
        <Text bold color="green">Quick Commands</Text>
        <Box marginTop={1} flexDirection="column">
          <Text color="white">  echo chat "message"     - Start a conversation</Text>
          <Text color="white">  echo chat --agent       - Agent mode with tools</Text>
          <Text color="white">  echo plugin sync-all    - Sync plugins</Text>
          <Text color="white">  echo auth sync          - Auto-detect credentials</Text>
          <Text color="white">  q                       - Quit dashboard</Text>
        </Box>
      </Box>

      {/* Footer */}
      <Box>
        <Text color="gray" dim>
          Press 'q' to quit • Press Ctrl+C to force exit
        </Text>
      </Box>
    </Box>
  );
};

export default Dashboard;
