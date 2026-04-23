/**
 * ECHOMEN TUI Components - MessageHistory
 * Displays conversation history with syntax highlighting
 */

import React, { useMemo } from 'react';
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

/**
 * ECHOMEN TUI Components - MessageHistory
 * Displays conversation history with syntax highlighting
 * Performance: Optimized with direct slicing and memoized components (Bolt ⚡)
 */
export function MessageHistory({ messages, isProcessing, mode, streamingMessage }: MessageHistoryProps) {
  // Calculate visible messages directly to avoid redundant useEffect/useRef cycles
  const scrollOffset = Math.max(0, messages.length - 10);
  const visibleMessages = messages.slice(scrollOffset);

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
            // Use timestamp as key for stable identity and better memoization performance (Bolt ⚡)
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

/**
 * MessageItem - Renders a single message
 * Performance: Memoized to prevent re-renders when other messages update (Bolt ⚡)
 */
const MessageItem = React.memo(({ message, isStreaming = false }: MessageItemProps) => {
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

// Regex for code blocks (moved to module level to avoid re-allocation)
const CODE_BLOCK_REGEX = /```(\w+)?\n([\s\S]*?)```/g;

/**
 * MessageContent - Parses and renders text/code blocks
 * Performance: Memoized to prevent redundant parsing during streaming (Bolt ⚡)
 */
const MessageContent = React.memo(({ content }: MessageContentProps) => {
  // Use useMemo to avoid re-splitting the same content
  const components = useMemo(() => {
    // Correctly split content into parts while preserving capture groups
    // This allows us to alternate between text and code/language pairs
    const parts = content.split(CODE_BLOCK_REGEX);

    if (parts.length === 1) {
      return <Text>{content}</Text>;
    }

    const elements = [];
    for (let i = 0; i < parts.length; i += 3) {
      // i: plain text before/between code blocks
      // i+1: language identifier (if any)
      // i+2: code content

      const textPart = parts[i];
      if (textPart && textPart.trim()) {
        elements.push(<Text key={`text-${i}`}>{textPart}</Text>);
      }

      if (i + 2 < parts.length) {
        const language = parts[i+1] || 'text';
        const code = parts[i+2] || '';
        elements.push(
          <Box key={`code-${i}`} marginTop={1} marginBottom={1}>
            <CodeBlock code={code} language={language} showLineNumbers />
          </Box>
        );
      }
    }

    return <Box flexDirection="column">{elements}</Box>;
  }, [content]);

  return components;
});
