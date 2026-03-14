/**
 * ECHOMEN TUI Components - CommandInput
 * Natural language input with autocomplete and suggestions
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { ViewMode } from '../types.js';

interface CommandInputProps {
  onSubmit: (value: string) => void;
  disabled: boolean;
  mode: ViewMode;
}

export function CommandInput({ onSubmit, disabled, mode }: CommandInputProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);

  const modePrompts: Record<ViewMode, string> = {
    chat: 'Ask anything...',
    agent: 'Describe a task for the agent...',
    code: 'Enter code or describe code changes...',
    browser: 'Enter a URL or describe web task...',
    memory: 'Search memories or save knowledge...',
  };

  useInput((input, key) => {
    if (disabled) return;

    // Tab completion for suggestions
    if (key.tab && suggestions.length > 0) {
      setValue(suggestions[selectedSuggestion]);
      setSuggestions([]);
      return;
    }

    // Submit on Enter
    if (key.return && value.trim()) {
      onSubmit(value.trim());
      setValue('');
      setSuggestions([]);
    }
  });

  // Generate suggestions based on input
  useEffect(() => {
    if (value.length > 2) {
      const commonCommands = [
        'create a file',
        'write a function',
        'search for',
        'open browser',
        'git commit',
        'explain',
        'refactor',
        'test',
      ];
      const filtered = commonCommands.filter(cmd =>
        cmd.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 3));
      setSelectedSuggestion(0);
    } else {
      setSuggestions([]);
    }
  }, [value]);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" padding={1}>
      {/* Input prompt */}
      <Box flexDirection="row">
        <Text color="green" bold>{'> '} </Text>
        <Box flexGrow={1}>
          {disabled ? (
            <Text color="gray">{modePrompts[mode]} (processing...)</Text>
          ) : (
            <TextInput
              value={value}
              onChange={setValue}
              placeholder={modePrompts[mode]}
            />
          )}
        </Box>
      </Box>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Box flexDirection="column" marginTop={1} paddingLeft={2}>
          <Text color="gray" dimColor>Suggestions (Tab to complete):</Text>
          {suggestions.map((suggestion, index) => (
            <Box key={suggestion}>
              <Text color={index === selectedSuggestion ? 'cyan' : 'gray'}>
                {index === selectedSuggestion ? '> ' : '  '}
                {suggestion}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
