/**
 * ECHOMEN Hooks - Cognitive Engine
 * React hook for managing the BDI cognitive engine
 */

import { useState, useCallback, useRef } from 'react';
import { ViewMode } from '../tui/types.js';
import { ReActEngine, createReActEngine } from '../core/engine.js';
import { createDefaultChain, ProviderChain } from '../providers/chain.js';
import { getConfig } from '../utils/config.js';

export type CognitiveState =
  | 'IDLE'
  | 'PERCEIVE'
  | 'REASON'
  | 'PLAN'
  | 'ACT'
  | 'OBSERVE'
  | 'REFLECT'
  | 'LEARN';

export interface EngineState {
  state: CognitiveState;
  currentTask?: string;
  progress: number;
  isProcessing: boolean;
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
        state: 'PERCEIVE',
        progress: 0.1,
      }));

      try {
        const engine = getEngine();
        const engineMode = MODE_TO_ENGINE[mode];

        // Simulate cognitive states with delays
        // PERCEIVE
        setEngineState(prev => ({ ...prev, state: 'PERCEIVE', progress: 0.2 }));
        await new Promise(resolve => setTimeout(resolve, 200));

        // REASON
        setEngineState(prev => ({ ...prev, state: 'REASON', progress: 0.3 }));
        await new Promise(resolve => setTimeout(resolve, 300));

        // PLAN
        setEngineState(prev => ({ ...prev, state: 'PLAN', progress: 0.4 }));
        await new Promise(resolve => setTimeout(resolve, 200));

        // ACT - Run the actual engine
        setEngineState(prev => ({ ...prev, state: 'ACT', progress: 0.5 }));
        const result = await engine.run(input);

        // OBSERVE
        setEngineState(prev => ({ ...prev, state: 'OBSERVE', progress: 0.8 }));
        await new Promise(resolve => setTimeout(resolve, 100));

        // REFLECT
        setEngineState(prev => ({ ...prev, state: 'REFLECT', progress: 0.9 }));
        await new Promise(resolve => setTimeout(resolve, 100));

        // LEARN
        setEngineState(prev => ({ ...prev, state: 'LEARN', progress: 1.0 }));
        await new Promise(resolve => setTimeout(resolve, 100));

        // Return to IDLE
        setEngineState({
          state: 'IDLE',
          progress: 0,
          isProcessing: false,
          currentTask: undefined,
        });

        return result.result || 'Task completed.';
      } catch (error: any) {
        setEngineState({
          state: 'IDLE',
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
  };
}

export function useCognitiveState(): CognitiveState {
  const [state] = useState<CognitiveState>('IDLE');
  return state;
}
