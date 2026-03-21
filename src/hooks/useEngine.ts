/**
 * ECHOMEN Hooks - Cognitive Engine
 * React hook for managing the BDI cognitive engine
 */

import { useState, useCallback, useRef } from 'react';
import { ViewMode } from '../tui/types.js';
import { createBDIEngine } from '../core/engine.js';
import { BDIEngine } from '../core/bdi-engine.js';
import { CognitiveState, TaskNode } from '../core/bdi-types.js';
import { createDefaultChain } from '../providers/chain.js';
import { getConfig } from '../utils/config.js';

export { CognitiveState };

export interface EngineState {
  state: CognitiveState;
  currentTask?: string;
  progress: number;
  isProcessing: boolean;
  plan?: TaskNode[];
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
    state: CognitiveState.IDLE,
    progress: 0,
    isProcessing: false,
  });

  const engineRef = useRef<BDIEngine | null>(null);

  // Initialize engine on first use
  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      const config = getConfig();
      const providerConfigs = config.getAllProviderConfigs();
      const chain = createDefaultChain(providerConfigs);
      engineRef.current = createBDIEngine(chain, {
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
        state: CognitiveState.PERCEIVE,
        progress: 0.1,
      }));

      try {
        const engine = getEngine();
        const result = await engine.execute(input, (state: CognitiveState, progress: number) => {
          setEngineState(prev => ({
            ...prev,
            state,
            progress,
            plan: engine.getLatestIntention()?.plan,
          }));
        });

        // Return to IDLE
        setEngineState({
          state: CognitiveState.IDLE,
          progress: 0,
          isProcessing: false,
          currentTask: undefined,
        });

        return result.result || 'Task completed.';
      } catch (error: any) {
        setEngineState({
          state: CognitiveState.IDLE,
          progress: 0,
          isProcessing: false,
          currentTask: undefined,
        });
        return `Error: ${error.message}`;
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
    plan: engineState.plan,
  };
}

export function useCognitiveState(): CognitiveState {
  const [state] = useState<CognitiveState>(CognitiveState.IDLE);
  return state;
}
