/**
 * ECHOMEN TUI Components - FileTree
 * Directory tree navigation and display
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { readdir, stat } from 'fs/promises';
import { join, basename } from 'path';

interface FileTreeProps {
  rootPath?: string;
  onSelect?: (path: string) => void;
  maxDepth?: number;
  height?: number;
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  isExpanded: boolean;
  children?: FileNode[];
  depth: number;
}

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.npm',
  '.cache',
  '__pycache__',
  'venv',
  '.venv',
];

const MAX_FILES = 500;

export function FileTree({ rootPath = '.', onSelect, maxDepth = 5, height = 15 }: FileTreeProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [cursorIndex, setCursorIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial tree
  useEffect(() => {
    loadTree(rootPath);
  }, [rootPath]);

  const loadTree = async (path: string) => {
    try {
      setIsLoading(true);
      const rootNode = await loadDirectory(path, 0);
      setTree(rootNode.children || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDirectory = async (path: string, depth: number): Promise<FileNode> => {
    const node: FileNode = {
      name: basename(path) || path,
      path,
      isDirectory: true,
      isExpanded: depth < 2, // Expand first 2 levels by default
      depth,
    };

    if (depth >= maxDepth) {
      return node;
    }

    try {
      const entries = await readdir(path, { withFileTypes: true });
      const children: FileNode[] = [];

      for (const entry of entries) {
        if (IGNORE_PATTERNS.includes(entry.name) || entry.name.startsWith('.')) {
          continue;
        }

        const childPath = join(path, entry.name);
        const childNode: FileNode = {
          name: entry.name,
          path: childPath,
          isDirectory: entry.isDirectory(),
          isExpanded: false,
          depth: depth + 1,
        };

        children.push(childNode);

        if (children.length >= MAX_FILES) {
          break;
        }
      }

      // Sort: directories first, then files, alphabetically
      children.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      node.children = children;
    } catch (err) {
      // Ignore errors for inaccessible directories
    }

    return node;
  };

  // Flatten tree for rendering and navigation
  const flattenTree = (nodes: FileNode[], result: FileNode[] = []): FileNode[] => {
    for (const node of nodes) {
      result.push(node);
      if (node.isDirectory && node.isExpanded && node.children) {
        flattenTree(node.children, result);
      }
    }
    return result;
  };

  const flatTree = flattenTree(tree);
  const selectedNode = flatTree[cursorIndex];

  // Handle keyboard navigation
  useInput((input, key) => {
    if (key.upArrow) {
      setCursorIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setCursorIndex(prev => Math.min(flatTree.length - 1, prev + 1));
    } else if (key.rightArrow && selectedNode?.isDirectory) {
      // Expand directory
      toggleExpand(selectedNode.path, true);
    } else if (key.leftArrow && selectedNode?.isDirectory) {
      // Collapse directory
      toggleExpand(selectedNode.path, false);
    } else if (input === 'Enter' && selectedNode) {
      // Select file/directory
      if (onSelect) {
        onSelect(selectedNode.path);
      }
      if (selectedNode.isDirectory) {
        toggleExpand(selectedNode.path, !selectedNode.isExpanded);
      }
    }
  });

  const toggleExpand = async (path: string, expand: boolean) => {
    const toggleNode = (node: FileNode): FileNode => {
      if (node.path === path) {
        return { ...node, isExpanded: expand };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(toggleNode),
        };
      }
      return node;
    };

    setTree(prev => prev.map(toggleNode));

    // If expanding and no children loaded, load them
    if (expand) {
      const node = flatTree.find(n => n.path === path);
      if (node && node.isDirectory && (!node.children || node.children.length === 0)) {
        const updated = await loadDirectory(path, node.depth);
        updateNodeChildren(path, updated.children || []);
      }
    }
  };

  const updateNodeChildren = (path: string, children: FileNode[]) => {
    const updateNode = (node: FileNode): FileNode => {
      if (node.path === path) {
        return { ...node, children };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNode),
        };
      }
      return node;
    };

    setTree(prev => prev.map(updateNode));
  };

  if (isLoading) {
    return (
      <Box padding={1}>
        <Text color="yellow">⟳ Loading file tree...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={1}>
        <Text color="red">✗ Error: {error}</Text>
      </Box>
    );
  }

  // Calculate viewport for scrolling
  const [startIndex, setStartIndex] = useState(0);
  const viewportHeight = height - 2; // Subtract header and padding/selected indicator

  useEffect(() => {
    // Keep cursor within viewport
    if (cursorIndex < startIndex) {
      setStartIndex(cursorIndex);
    } else if (cursorIndex >= startIndex + viewportHeight) {
      setStartIndex(cursorIndex - viewportHeight + 1);
    }
  }, [cursorIndex, viewportHeight, startIndex]);

  if (isLoading) {
    return (
      <Box padding={1}>
        <Text color="yellow">⟳ Loading file tree...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={1}>
        <Text color="red">✗ Error: {error}</Text>
      </Box>
    );
  }

  const visibleNodes = flatTree.slice(startIndex, startIndex + viewportHeight);

  return (
    <Box flexDirection="column" height={height} borderStyle="round" borderColor="gray" paddingX={1}>
      <Box marginBottom={0}>
        <Text bold color="cyan">📁 EXPLORER</Text>
      </Box>
      
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {flatTree.length === 0 ? (
          <Text color="gray" dimColor>No files to display</Text>
        ) : (
          visibleNodes.map((node, index) => (
            <FileTreeNode
              key={node.path}
              node={node}
              isSelected={startIndex + index === cursorIndex}
            />
          ))
        )}
      </Box>

      <Box marginTop={0} borderTop borderColor="gray">
        <Text color="gray" dimColor wrap="truncate-end">
          {startIndex + viewportHeight < flatTree.length ? "↓ more..." : " "}
        </Text>
      </Box>
    </Box>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  isSelected: boolean;
}

function FileTreeNode({ node, isSelected }: FileTreeNodeProps) {
  const icon = node.isDirectory
    ? node.isExpanded
      ? '📂'
      : '📁'
    : getFileIcon(node.name);

  const indent = '  '.repeat(node.depth);

  return (
    <Box>
      <Text color={isSelected ? 'black' : (node.isDirectory ? 'white' : 'gray')}>
        {isSelected ? (
          <Box backgroundColor="white">
            <Text>{indent}{icon} {node.name}</Text>
          </Box>
        ) : (
          <Text>{indent}{icon} {node.name}</Text>
        )}
      </Text>
    </Box>
  );
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    'ts': '📘',
    'tsx': '⚛️',
    'js': '📜',
    'jsx': '⚛️',
    'py': '🐍',
    'rs': '🦀',
    'go': '🔷',
    'java': '☕',
    'c': '🔵',
    'cpp': '🔷',
    'cs': '🔷',
    'rb': '💎',
    'swift': '🍎',
    'kt': '🎯',
    'php': '🐘',
    'html': '🌐',
    'css': '🎨',
    'scss': '🎨',
    'json': '📋',
    'yaml': '📋',
    'yml': '📋',
    'md': '📝',
    'txt': '📄',
    'sh': '⚡',
    'bash': '⚡',
    'zsh': '⚡',
    'fish': '🐟',
    'sql': '🗄️',
    'xml': '📋',
    'toml': '📋',
    'lock': '🔒',
    'gitignore': '🙈',
    'dockerfile': '🐳',
    'makefile': '🔨',
  };

  return iconMap[ext || ''] || '📄';
}
