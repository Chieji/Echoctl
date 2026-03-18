/**
 * ECHOMEN TUI Components - BDICycle
 * Visualizes the BDI Cognitive Cycle with animated state transitions
 * 
 * BDI Cycle Stages:
 * 1. PERCEIVE - Gather information from environment and memory
 * 2. REASON - Formulate intentions and goals
 * 3. PLAN - Create action plan
 * 4. ACT - Execute actions
 * 5. OBSERVE - Monitor results
 * 6. REFLECT - Analyze outcomes
 * 7. LEARN - Update beliefs and memory
 */

import React, { useEffect, useState } from 'react';
import { Box, Text, useStdout } from 'ink';
import { CognitiveState } from '../../core/bdi-types.js';

interface BDICycleProps {
  state: CognitiveState;
  isProcessing?: boolean;
  progress?: number;
}

interface CycleStage {
  id: CognitiveState;
  label: string;
  description: string;
  icon: string;
  color: string;
  position: { x: number; y: number };
}

const CYCLE_STAGES: CycleStage[] = [
  {
    id: 'PERCEIVE',
    label: 'PERCEIVE',
    description: 'Gathering context from environment and memory',
    icon: '👁',
    color: 'cyan',
    position: { x: 0, y: 0 },
  },
  {
    id: 'REASON',
    label: 'REASON',
    description: 'Formulating intentions and goals',
    icon: '🧠',
    color: 'magenta',
    position: { x: 1, y: 0 },
  },
  {
    id: 'PLAN',
    label: 'PLAN',
    description: 'Creating action strategy',
    icon: '📋',
    color: 'blue',
    position: { x: 2, y: 0 },
  },
  {
    id: 'ACT',
    label: 'ACT',
    description: 'Executing actions',
    icon: '⚡',
    color: 'yellow',
    position: { x: 3, y: 0 },
  },
  {
    id: 'OBSERVE',
    label: 'OBSERVE',
    description: 'Monitoring results',
    icon: '🔍',
    color: 'green',
    position: { x: 4, y: 0 },
  },
  {
    id: 'REFLECT',
    label: 'REFLECT',
    description: 'Analyzing outcomes',
    icon: '💭',
    color: 'white',
    position: { x: 5, y: 0 },
  },
  {
    id: 'LEARN',
    label: 'LEARN',
    description: 'Updating beliefs and memory',
    icon: '📚',
    color: 'red',
    position: { x: 6, y: 0 },
  },
];

// Get color function based on state
const getStateColor = (state: CognitiveState, isActive: boolean, isCompleted: boolean): string => {
  if (isActive) return 'yellow';
  if (isCompleted) return 'green';
  return 'gray';
};

// Animation frames for the active indicator
const ANIMATION_FRAMES = ['◐', '◓', '◑', '◒'];

export function BDICycle({ state, isProcessing = false, progress = 0 }: BDICycleProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const { stdout } = useStdout();

  // Animation effect for the active state
  useEffect(() => {
    if (!isProcessing) return;
    
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % ANIMATION_FRAMES.length);
    }, 150);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // Get current stage index
  const currentStageIndex = CYCLE_STAGES.findIndex((stage) => stage.id === state);
  const isIdle = state === 'IDLE';

  // Calculate progress bar
  const progressWidth = 40;
  const filledWidth = Math.floor(progress * progressWidth);
  const progressBar = '█'.repeat(filledWidth) + '░'.repeat(progressWidth - filledWidth);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={isProcessing ? 'yellow' : 'gray'} padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={isProcessing ? 'yellow' : 'cyan'}>
          🧠 BDI Cognitive Cycle
        </Text>
        {isProcessing && (
          <Text color="yellow"> {ANIMATION_FRAMES[frameIndex]}</Text>
        )}
      </Box>

      {/* Cycle Visualization - Horizontal Flow */}
      <Box flexDirection="row" marginBottom={1}>
        {CYCLE_STAGES.map((stage, index) => {
          const isActive = stage.id === state;
          const isCompleted = currentStageIndex > index && !isIdle;
          const color = getStateColor(stage.id, isActive, isCompleted);

          return (
            <Box key={stage.id} flexDirection="column" alignItems="center" marginX={1}>
              {/* Stage Icon */}
              <Box
                borderStyle={isActive ? 'double' : 'single'}
                borderColor={isActive ? 'yellow' : isCompleted ? 'green' : 'gray'}
                paddingX={1}
                paddingY={0}
              >
                <Text color={isActive ? 'yellow' : isCompleted ? stage.color : 'gray'}>
                  {isActive ? ANIMATION_FRAMES[frameIndex] : stage.icon}
                </Text>
              </Box>
              
              {/* Stage Label */}
              <Text
                color={isActive ? 'yellow' : isCompleted ? stage.color : 'gray'}
                bold={isActive}
                dimColor={!isActive && !isCompleted}
              >
                {stage.label}
              </Text>

              {/* Connector Arrow */}
              {index < CYCLE_STAGES.length - 1 && (
                <Box position="absolute" marginLeft={4}>
                  <Text color={isCompleted ? 'green' : 'gray'} dimColor={!isCompleted}>
                    →
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Current State Description */}
      {!isIdle && (
        <Box marginBottom={1}>
          <Text color="gray">Current: </Text>
          <Text color="yellow" bold>
            {state}
          </Text>
          <Text color="gray"> - </Text>
          <Text color="white" dimColor>
            {CYCLE_STAGES.find((s) => s.id === state)?.description || 'Ready'}
          </Text>
        </Box>
      )}

      {/* Progress Bar */}
      {isProcessing && (
        <Box flexDirection="column">
          <Box>
            <Text color="gray">Progress: </Text>
            <Text color="cyan">{progressBar}</Text>
            <Text color="gray"> {Math.round(progress * 100)}%</Text>
          </Box>
        </Box>
      )}

      {/* Idle State */}
      {isIdle && (
        <Box>
          <Text color="gray" dimColor>
            Waiting for input... Press Ctrl+P for command palette
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Compact BDI Indicator for use in status bars or small spaces
 */
interface BDIIndicatorProps {
  currentState: CognitiveState;
  isProcessing: boolean;
}

export function BDIIndicator({ currentState, isProcessing }: BDIIndicatorProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!isProcessing) return;
    
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % ANIMATION_FRAMES.length);
    }, 150);

    return () => clearInterval(interval);
  }, [isProcessing]);

  const currentStage = CYCLE_STAGES.find((s) => s.id === currentState);
  const stageIndex = CYCLE_STAGES.findIndex((s) => s.id === currentState);

  if (currentState === 'IDLE') {
    return (
      <Text color="gray" dimColor>
        ● IDLE
      </Text>
    );
  }

  return (
    <Box>
      <Text color="yellow">{ANIMATION_FRAMES[frameIndex]}</Text>
      <Text color="cyan"> {currentStage?.icon}</Text>
      <Text color="yellow" bold> {currentState}</Text>
      <Text color="gray"> ({stageIndex + 1}/{CYCLE_STAGES.length})</Text>
    </Box>
  );
}

/**
 * Vertical BDI Cycle for sidebar display
 */
interface VerticalBDICycleProps {
  currentState: CognitiveState;
  isProcessing: boolean;
}

export function VerticalBDICycle({ currentState, isProcessing }: VerticalBDICycleProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const currentStageIndex = CYCLE_STAGES.findIndex((stage) => stage.id === currentState);

  useEffect(() => {
    if (!isProcessing) return;
    
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % ANIMATION_FRAMES.length);
    }, 150);

    return () => clearInterval(interval);
  }, [isProcessing]);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1}>
      <Text bold color="cyan" underline>
        BDI Cycle
      </Text>
      
      {CYCLE_STAGES.map((stage, index) => {
        const isActive = stage.id === currentState;
        const isCompleted = currentStageIndex > index && currentState !== 'IDLE';
        
        return (
          <Box key={stage.id} marginY={0}>
            <Text color={isActive ? 'yellow' : isCompleted ? 'green' : 'gray'}>
              {isActive ? ANIMATION_FRAMES[frameIndex] : isCompleted ? '✓' : '○'}
            </Text>
            <Text
              color={isActive ? 'yellow' : isCompleted ? stage.color : 'gray'}
              bold={isActive}
              dimColor={!isActive && !isCompleted}
            >
              {' '}{stage.label}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
