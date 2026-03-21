import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { getBrainStore } from '../../storage/brain.js';

export function MemoryPanel() {
  const [stats, setStats] = useState({ totalMemories: 0 });
  const [memories, setMemories] = useState<any[]>([]);

  useEffect(() => {
    const brain = getBrainStore();
    setStats(brain.getStats());
    // Load recent memories
    setMemories(brain.search('', []).slice(0, 10));
  }, []);

  return (
    <Box flexDirection="column" padding={1} borderStyle="single" borderColor="yellow">
      <Text bold color="yellow">🧠 SECOND BRAIN</Text>
      <Box marginY={1}>
        <Text color="gray">Total Memories: </Text>
        <Text color="white">{stats.totalMemories}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Recent Memories:</Text>
        {memories.length === 0 ? (
          <Text color="gray" dimColor italic>No memories found</Text>
        ) : (
          memories.map((m, i) => (
            <Box key={i} marginY={0}>
              <Text color="cyan">• </Text>
              <Text color="white">{m.key}: </Text>
              <Text color="gray" wrap="truncate-end">{m.value.substring(0, 40)}...</Text>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
