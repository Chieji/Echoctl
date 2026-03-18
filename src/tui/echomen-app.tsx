/**
 * ECHOMEN Main Application
 * The full cognitive agent terminal experience
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { ViewMode, Message as MessageType } from './types.js';
import { Header } from './components/Header.js';
import { StatusBar } from './components/StatusBar.js';
import { MessageHistory } from './components/MessageHistory.js';
import { CommandInput } from './components/CommandInput.js';
import { ContextPanel } from './components/ContextPanel.js';
import { FileTree } from './components/FileTree.js';
import { CommandPalette } from './components/CommandPalette.js';
import { BDICycle } from './components/BDICycle.js';
import { ThoughtProcessPanel } from './components/ThoughtProcessPanel.js';
import { useCognitiveEngine } from '../hooks/useEngine.js';

interface EchomenAppProps {
  initialMode?: ViewMode;
}

export function EchomenApp({ initialMode = 'chat' }: EchomenAppProps) {
  const { exit } = useApp();
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<MessageType | null>(null);

  const { process, state: cognitiveState, isProcessing: engineProcessing } = useCognitiveEngine();

  // Handle global keyboard shortcuts
  useInput((input, key) => {
    // Command palette: Ctrl+P
    if (key.ctrl && input === 'p') {
      setShowCommandPalette(prev => !prev);
      return;
    }

    // Mode switching
    if (key.ctrl && input === '1') setMode('chat');
    if (key.ctrl && input === '2') setMode('agent');
    if (key.ctrl && input === '3') setMode('code');
    if (key.ctrl && input === '4') setMode('browser');
    if (key.ctrl && input === '5') setMode('memory');

    // Exit on Ctrl+C
    if (key.ctrl && input === 'c') {
      exit();
    }
  });

  // Handle command submission
  const handleSubmit = useCallback(async (value: string) => {
    if (!value.trim() || isProcessing) return;

    // Add user message
    const userMessage: MessageType = {
      role: 'user',
      content: value,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Create streaming message placeholder
    const streamingMsg: MessageType = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    setStreamingMessage(streamingMsg);

    try {
      // Process with cognitive engine
      const result = await process(value, mode);

      // Simulate streaming by updating character by character
      const chars = result.split('');
      for (let i = 0; i < chars.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
        setStreamingMessage(prev => prev ? ({
          ...prev,
          content: prev.content + chars[i]
        }) : null);
      }

      // Finalize message
      const finalMessage: MessageType = {
        role: 'assistant',
        content: result,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, finalMessage]);
      setStreamingMessage(null);
    } catch (error: any) {
      const errorMessage: MessageType = {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setStreamingMessage(null);
    } finally {
      setIsProcessing(false);
    }
  }, [mode, isProcessing, process]);

  // Handle mode change from command palette
  const handleModeChange = useCallback((newMode: ViewMode) => {
    setMode(newMode);
    setShowCommandPalette(false);
  }, []);

  return (
    <Box flexDirection="column" height="100%">
      {/* Header with logo and mode */}
      <Header mode={mode} />

      {/* Status bar with cognitive state and shortcuts */}
      <StatusBar 
        mode={mode} 
        isProcessing={isProcessing || engineProcessing} 
        messageCount={messages.length}
        cognitiveState={cognitiveState}
      />

      {/* Main content area */}
      <Box flexDirection="row" flexGrow={1} overflow="hidden">
        {/* Left panel - File Tree Explorer */}
        <Box width={30} borderStyle="single" borderColor="gray" marginRight={1}>
          <FileTree 
            rootPath="." 
            onSelect={(path) => {
              // Handle file selection (e.g., could open in editor or just show info)
            }}
            height={20} // This will be constrained by the parent Box anyway
          />
        </Box>

        {/* Middle panel - Messages and input */}
        <Box flexDirection="column" flexGrow={1} borderStyle="single" borderColor="cyan" marginRight={1}>
          {/* Message history */}
          <Box flexGrow={1} overflow="hidden">
            <MessageHistory
              messages={messages}
              isProcessing={isProcessing || engineProcessing}
              mode={mode}
              streamingMessage={streamingMessage}
            />
          </Box>

          {/* Command input */}
          <Box flexDirection="column" borderTop>
            <CommandInput
              onSubmit={handleSubmit}
              disabled={isProcessing || engineProcessing}
              mode={mode}
            />
          </Box>
        </Box>

        {/* Right panel - Context information and BDI visualization */}
        <Box width={35} flexDirection="column" borderStyle="single" borderColor="gray">
          {/* BDI Cognitive Cycle Visualization */}
          <Box flexDirection="column" paddingX={1} paddingY={1}>
            <Text color="cyan" bold>BDI Cognitive Cycle</Text>
            <BDICycle state={cognitiveState} />
          </Box>
          
          {/* Context Panel */}
          <Box flexGrow={1}>
            <ContextPanel mode={mode} />
          </Box>
        </Box>
      </Box>

      {/* Command palette overlay */}
      {showCommandPalette && (
        <Box flexDirection="column" alignItems="center">
          <CommandPalette
            onSelect={(cmd) => {
              if (['chat', 'agent', 'code', 'browser', 'memory'].includes(cmd)) {
                handleModeChange(cmd as ViewMode);
              }
            }}
            onClose={() => setShowCommandPalette(false)}
            currentMode={mode}
          />
        </Box>
      )}

      {/* Footer with cognitive state */}
      <Box marginTop={1} flexDirection="column" alignItems="center">
        <Text color="gray" dimColor>
          Ctrl+P: Command Palette | Ctrl+1-5: Switch Mode | Ctrl+C: Exit
        </Text>
        {(isProcessing || engineProcessing) && (
          <Text color="yellow">
            ⟳ {cognitiveState}: Processing...
          </Text>
        )}
      </Box>
    </Box>
  );
}
