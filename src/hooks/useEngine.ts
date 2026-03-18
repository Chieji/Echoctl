/**
 * ECHOMEN Hooks - Cognitive Engine
 * React hook for managing the BDI cognitive engine
 */

import { useState, useCallback, useRef } from 'react';
import { ViewMode } from '../tui/types.js';
import { ReActEngine, createReActEngine } from '../core/engine.js';
import { createDefaultChain, ProviderChain } from '../providers/chain.js';
import { getConfig } from '../utils/config.js';
import { CognitiveState } from '../core/bdi-types.js';

export interface EngineState {
  state: CognitiveState;
  currentTask?: string;
  progress: number;
  isProcessing: boolean;
  actions: string[];
}

const MODE_TO_ENGINE: Record<ViewMode, 'chat' | 'agent'> = {
  chat: 'chat',
  agent: 'agent',
  code: 'agent',
  browser: 'agent',
  memory: 'chat',
};

export function useCognitiveEngine() {
  const [engineState, setEngineState] = useState<EngineState>({
    state: 'IDLE',
    progress: 0,
    isProcessing: false,
    actions: [],
  });

  const engineRef = useRef<ReActEngine | null>(null);

  // Initialize engine on first use
  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      const config = getConfig();
      const providerConfigs = config.getAllProviderConfigs();
      const chain = createDefaultChain(providerConfigs);
      engineRef.current = createReActEngine(chain, {
        yoloMode: false,
        maxIterations: 10,
        contextLength: 10,
      });
    }
    return engineRef.current;
  }, []);

  const process = useCallback(
    async (input: string, mode: ViewMode): Promise<string> => {
      setEngineState(prev => ({
        ...prev,
        isProcessing: true,
        currentTask: input,
        actions: [],
      }));

      const stageProgress: Record<CognitiveState, number> = {
        IDLE: 0,
        PERCEIVE: 0.1,
        REASON: 0.25,
        PLAN: 0.4,
        ACT: 0.55,
        OBSERVE: 0.7,
        REFLECT: 0.85,
        LEARN: 1,
      };

      const addAction = (action: string) => {
        setEngineState(prev => ({
          ...prev,
          actions: [...prev.actions, action],
        }));
      };

      const setStage = (stage: CognitiveState) => {
        setEngineState(prev => ({
          ...prev,
          state: stage,
          progress: stageProgress[stage] ?? prev.progress,
        }));
      };

      try {
        const engine = getEngine();

        // Update stage based on engine lifecycle
        setStage('PERCEIVE');
        const result = await engine.run(input, undefined, setStage, addAction);

        // Ensure final state updates
        setStage('LEARN');

        return result.result || 'Task completed.';
      } catch (error: any) {
        return `Error: ${error.message}`;
      } finally {
        setEngineState(prev => ({
          ...prev,
          state: 'IDLE',
          progress: 0,
          isProcessing: false,
          currentTask: undefined,
        }));
      }
    },
    [getEngine]
  );

  return {
    process,
    state: engineState.state,
    progress: engineState.progress,
    isProcessing: engineState.isProcessing,
    currentTask: engineState.currentTask,
    actions: engineState.actions,
  };
}

export function useCognitiveState(): CognitiveState {
  const [state] = useState<CognitiveState>('IDLE');
  return state;
}
