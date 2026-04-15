/**
 * ECHOMEN TUI Components - MessageHistory
 * Displays conversation history with syntax highlighting
 */

import React, { useEffect, useRef, memo } from 'react';
import { Box, Text } from 'ink';
import { Message as MessageType } from '../../types/index.js';
import { ViewMode } from '../types.js';
import { CodeBlock } from './CodeBlock.js';

interface MessageHistoryProps {
  messages: MessageType[];
  isProcessing: boolean;
  mode: ViewMode;
  streamingMessage?: MessageType | null;
}

export function MessageHistory({ messages, isProcessing, mode, streamingMessage }: MessageHistoryProps) {
  const scrollRef = useRef(0);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current = Math.max(0, messages.length - 10);
  }, [messages.length, streamingMessage]);

  const visibleMessages = messages.slice(scrollRef.current);

  return (
    <Box flexDirection="column" flexGrow={1} overflow="hidden" padding={1}>
      {visibleMessages.length === 0 && !streamingMessage ? (
        <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
          <Text color="gray" dimColor>
            Welcome to ECHO v2.0
          </Text>
          <Text color="gray" dimColor>
            Type a message or use Ctrl+P for command palette
          </Text>
        </Box>
      ) : (
        <>
          {visibleMessages.map((msg) => (
            <MessageItem key={msg.timestamp} message={msg} />
          ))}
          {streamingMessage && (
            <MessageItem message={streamingMessage} isStreaming />
          )}
        </>
      )}

      {isProcessing && !streamingMessage && (
        <Box marginTop={1}>
          <Text color="yellow">⟳ ECHO is thinking...</Text>
        </Box>
      )}
    </Box>
  );
}

interface MessageItemProps {
  message: MessageType;
  isStreaming?: boolean;
}

const MessageItem = memo(({ message, isStreaming = false }: MessageItemProps) => {
  const isUser = message.role === 'user';

  return (
    <Box
      flexDirection="column"
      marginY={1}
      borderStyle={isUser ? 'single' : 'round'}
      borderColor={isUser ? 'blue' : 'green'}
      padding={1}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={isUser ? 'blue' : 'green'} bold>
          {isUser ? 'You' : 'ECHO'}
          {isStreaming && ' (streaming...)'}
        </Text>
        <Text color="gray" dimColor>
          {' '}{new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      </Box>

      {/* Content with code block support */}
      <MessageContent content={message.content} />
    </Box>
  );
});

interface MessageContentProps {
  content: string;
}

/**
 * Regex for detecting markdown code blocks.
 * Moved to module level to avoid re-allocation during streaming (Performance: Bolt ⚡)
 */
const CODE_BLOCK_REGEX = /```(\w+)?\n([\s\S]*?)```/g;

const MessageContent = memo(({ content }: MessageContentProps) => {
  // Check for code blocks (```language ... ```)
  const parts = content.split(CODE_BLOCK_REGEX);
  
  if (parts.length === 1) {
    // No code blocks, just render text
    return <Text>{content}</Text>;
  }
  
  // Has code blocks, render with formatting
  return (
    <Box flexDirection="column">
      {parts.map((part, index) => {
        // With capturing groups in split, the result is [text, lang, code, text, lang, code, ...]
        // Every 3 parts correspond to one code block match (plus the initial/intervening text)
        // index 0: text before first block
        // index 1: lang of first block
        // index 2: code of first block
        // index 3: text between first and second block

        if (index % 3 === 0) {
          // Text content
          return part ? <Text key={index}>{part}</Text> : null;
        } else if (index % 3 === 1) {
          // Language identifier
          const language = part || 'text';
          const code = parts[index + 1] || '';
          return (
            <Box key={index} marginTop={1} marginBottom={1}>
              <CodeBlock code={code} language={language} showLineNumbers />
            </Box>
          );
        }
        // index % 3 === 2 is the code which we handled in index % 3 === 1
        return null;
      })}
    </Box>
  );
});
