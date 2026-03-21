import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Text } from 'ink';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box flexDirection="column" padding={2} borderStyle="double" borderColor="red">
          <Text color="red" bold>Something went wrong.</Text>
          <Box marginTop={1}>
            <Text color="white">{this.state.error?.message}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="gray" dimColor>Press Ctrl+C to exit.</Text>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
