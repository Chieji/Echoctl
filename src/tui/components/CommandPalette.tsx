/**
 * ECHOMEN TUI Components - CommandPalette
 * Global command palette with fuzzy search
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface CommandPaletteProps {
  onSelect: (command: string) => void;
  onClose: () => void;
  currentMode?: string;
}

interface Command {
  id: string;
  label: string;
  description: string;
  category: string;
}

const COMMANDS: Command[] = [
  // Mode switching
  { id: 'chat', label: 'Switch to Chat Mode', description: 'Standard conversation', category: 'Mode' },
  { id: 'agent', label: 'Switch to Agent Mode', description: 'Autonomous task execution', category: 'Mode' },
  { id: 'code', label: 'Switch to Code Mode', description: 'Code intelligence and editing', category: 'Mode' },
  { id: 'browser', label: 'Switch to Browser Mode', description: 'Web automation', category: 'Mode' },
  { id: 'memory', label: 'Switch to Memory Mode', description: 'Knowledge base management', category: 'Mode' },

  // Actions
  { id: 'clear', label: 'Clear Messages', description: 'Clear conversation history', category: 'Action' },
  { id: 'dashboard', label: 'Open Dashboard', description: 'View system stats', category: 'Action' },
  { id: 'health', label: 'System Health', description: 'Check all systems', category: 'Action' },

  // Settings
  { id: 'settings', label: 'Open Settings', description: 'Configure ECHO', category: 'Settings' },
  { id: 'providers', label: 'Provider Settings', description: 'Manage AI providers', category: 'Settings' },

  // System
  { id: 'quit', label: 'Quit ECHO', description: 'Exit application', category: 'System' },
];

export function CommandPalette({ onSelect, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState<Command[]>(COMMANDS);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.return && filtered.length > 0) {
      onSelect(filtered[selectedIndex].id);
      return;
    }

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex(prev => Math.min(filtered.length - 1, prev + 1));
      return;
    }
  });

  useEffect(() => {
    if (query) {
      const lowerQuery = query.toLowerCase();
      const filtered = COMMANDS.filter(
        cmd =>
          cmd.label.toLowerCase().includes(lowerQuery) ||
          cmd.description.toLowerCase().includes(lowerQuery) ||
          cmd.category.toLowerCase().includes(lowerQuery)
      );
      setFiltered(filtered);
      setSelectedIndex(0);
    } else {
      setFiltered(COMMANDS);
    }
  }, [query]);

  // Group by category
  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box marginBottom={1}>
        <Text color="cyan" bold>Command Palette</Text>
        <Text color="gray">  (Esc to close, ↑↓ to navigate, Enter to select)</Text>
      </Box>

      {/* Search input */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1} marginBottom={1}>
        <Text color="green">{'> '} </Text>
        <TextInput
          value={query}
          onChange={setQuery}
          placeholder="Type to search commands..."
        />
      </Box>

      {/* Commands list */}
      <Box flexDirection="column" height={15} overflow="hidden">
        {Object.entries(grouped).map(([category, commands]) => (
          <Box key={category} flexDirection="column" marginY={1}>
            <Text color="gray" dimColor>{category}</Text>
            {commands.map((cmd) => {
              const globalIndex = filtered.indexOf(cmd);
              const isSelected = globalIndex === selectedIndex;
              return (
                <Box
                  key={cmd.id}
                  paddingX={1}
                  backgroundColor={isSelected ? 'cyan' : undefined}
                >
                  <Box flexDirection="row">
                    <Box width={25}>
                      <Text
                        color={isSelected ? 'black' : 'white'}
                        bold={isSelected}
                      >
                        {cmd.label}
                      </Text>
                    </Box>
                    <Box flexGrow={1}>
                      <Text
                        color={isSelected ? 'black' : 'gray'}
                        dimColor={!isSelected}
                      >
                        {cmd.description}
                      </Text>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}

        {filtered.length === 0 && (
          <Box marginY={1}>
            <Text color="gray">No commands found matching "{query}"</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
