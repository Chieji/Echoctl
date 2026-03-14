/**
 * ECHOMEN TUI Components - ContextPanel
 * Shows context-specific information based on mode
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { ViewMode } from '../types.js';
import { getBrainStore } from '../../storage/brain.js';
import { getSessionStore } from '../../storage/sessions.js';
import { FileTree } from './FileTree.js';

interface ContextPanelProps {
  mode: ViewMode;
}

export function ContextPanel({ mode }: ContextPanelProps) {
  switch (mode) {
    case 'chat':
      return <ChatContext />;
    case 'agent':
      return <AgentContext />;
    case 'code':
      return <CodeContext />;
    case 'browser':
      return <BrowserContext />;
    case 'memory':
      return <MemoryContext />;
    default:
      return <ChatContext />;
  }
}

function ChatContext() {
  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>Chat Mode</Text>
      <Box marginY={1}>
        <Text color="gray" dimColor>Ask questions, get answers.</Text>
      </Box>
      <Box marginY={1}>
        <Text color="gray" dimColor>Shortcuts:</Text>
        <Text color="gray">  Ctrl+P: Command Palette</Text>
        <Text color="gray">  Ctrl+A: Agent Mode</Text>
        <Text color="gray">  Ctrl+Q: Quit</Text>
      </Box>
    </Box>
  );
}

function AgentContext() {
  return (
    <Box flexDirection="column">
      <Text color="green" bold>Agent Mode</Text>
      <Box marginY={1}>
        <Text color="gray" dimColor>ECHO can execute tasks autonomously.</Text>
      </Box>
      <Box marginY={1}>
        <Text color="gray" dimColor>Available Tools:</Text>
        <Text color="gray">  • Shell commands</Text>
        <Text color="gray">  • File operations</Text>
        <Text color="gray">  • Code execution</Text>
        <Text color="gray">  • Web browsing</Text>
        <Text color="gray">  • Git operations</Text>
      </Box>
    </Box>
  );
}

function CodeContext() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <Box flexDirection="column" flexGrow={1} overflow="hidden">
      <Text color="magenta" bold>Code Mode</Text>
      <Box marginY={1}>
        <Text color="gray" dimColor>File explorer and code intelligence.</Text>
      </Box>
      
      {/* File Tree */}
      <Box marginTop={1} flexGrow={1} overflow="hidden">
        <FileTree 
          rootPath="." 
          onSelect={(path) => setSelectedFile(path)}
          height={12}
        />
      </Box>

      {selectedFile && (
        <Box marginTop={1} borderTop borderColor="gray">
          <Text color="gray" dimColor>Selected: </Text>
          <Text color="cyan">{selectedFile}</Text>
        </Box>
      )}
    </Box>
  );
}

function BrowserContext() {
  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>Browser Mode</Text>
      <Box marginY={1}>
        <Text color="gray" dimColor>WebHawk 2.0 browser automation.</Text>
      </Box>
      <Box marginY={1}>
        <Text color="gray" dimColor>Capabilities:</Text>
        <Text color="gray">  • Visual navigation</Text>
        <Text color="gray">  • Screenshot analysis</Text>
        <Text color="gray">  • Form automation</Text>
        <Text color="gray">  • Data extraction</Text>
      </Box>
    </Box>
  );
}

function MemoryContext() {
  const [memories, setMemories] = useState(0);

  useEffect(() => {
    const brain = getBrainStore();
    const stats = brain.getStats();
    setMemories(stats.totalMemories);
  }, []);

  return (
    <Box flexDirection="column">
      <Text color="yellow" bold>Memory Mode</Text>
      <Box marginY={1}>
        <Text color="gray" dimColor>Second Brain knowledge base.</Text>
      </Box>
      <Box marginY={1}>
        <Text color="gray" dimColor>Stored Memories:</Text>
        <Text color="cyan" bold>{memories}</Text>
      </Box>
      <Box marginY={1}>
        <Text color="gray" dimColor>Commands:</Text>
        <Text color="gray">  save {'<key>'} {'<value>'}</Text>
        <Text color="gray">  get {'<key>'}</Text>
        <Text color="gray">  search {'<query>'}</Text>
      </Box>
    </Box>
  );
}
