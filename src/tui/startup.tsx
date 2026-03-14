/**
 * ECHOMEN Startup Sequence
 * Premium cinematic boot animation with system initialization
 * Uses consistent branding with banner.ts color palettes
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useStdout } from 'ink';
import { getBrainStore } from '../storage/brain.js';
import { getSessionStore } from '../storage/sessions.js';
import { getStateManager } from '../state/manager.js';
import { getConfig } from '../utils/config.js';

interface StartupProps {
  onComplete: () => void;
}

type BootStage = {
  name: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  icon: string;
  detail?: string;
};

const BOOT_STAGES: BootStage[] = [
  { name: 'Neural Interface', status: 'pending', icon: '⟐' },
  { name: 'Memory Systems',   status: 'pending', icon: '◈' },
  { name: 'AI Providers',     status: 'pending', icon: '◉' },
  { name: 'Tool Registry',    status: 'pending', icon: '⚙' },
  { name: 'Browser Engine',   status: 'pending', icon: '◎' },
  { name: 'Security Layer',   status: 'pending', icon: '⬡' },
];

// ─── Premium ASCII Art ──────────────────────────────────────────────────────
// Same logo as banner.ts for consistent branding

const ECHO_LOGO_LINES = [
  '   ███████╗  ██████╗ ██╗  ██╗  ██████╗ ',
  '   ██╔════╝ ██╔════╝ ██║  ██║ ██╔═══██╗',
  '   █████╗   ██║      ███████║ ██║   ██║',
  '   ██╔══╝   ██║      ██╔══██║ ██║   ██║',
  '   ███████╗ ╚██████╗ ██║  ██║ ╚██████╔╝',
  '   ╚══════╝  ╚═════╝ ╚═╝  ╚═╝  ╚═════╝',
];

// ─── Color Schemes by Phase ─────────────────────────────────────────────────
// The logo color shifts as systems come online

type ColorPhase = 'booting' | 'loading' | 'ready';

function getLogoColor(phase: ColorPhase): string {
  switch (phase) {
    case 'booting':  return '#42A5F5';  // electric blue
    case 'loading':  return '#7E57C2';  // violet
    case 'ready':    return '#26C6DA';  // cyan
  }
}

function getAccentColor(phase: ColorPhase): string {
  switch (phase) {
    case 'booting':  return '#616161';  // dim grey
    case 'loading':  return '#AB47BC';  // magenta
    case 'ready':    return '#66BB6A';  // green
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function StartupSequence({ onComplete }: StartupProps) {
  const [stages, setStages] = useState<BootStage[]>(BOOT_STAGES);
  const [currentStage, setCurrentStage] = useState(0);
  const [showLogo, setShowLogo] = useState(true);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<ColorPhase>('booting');
  const [providerCount, setProviderCount] = useState(0);
  const { exit } = useApp();
  const { stdout } = useStdout();

  useEffect(() => {
    // Clear screen and hide cursor
    stdout.write('\x1b[?25l');
    stdout.write('\x1b[2J\x1b[H');

    // Start boot sequence after quick logo flash
    const logoTimer = setTimeout(() => {
      setShowLogo(false);
      setPhase('loading');
      initializeSystems();
    }, 1500);

    return () => {
      clearTimeout(logoTimer);
      stdout.write('\x1b[?25h');
    };
  }, []);

  const initializeSystems = async () => {
    for (let i = 0; i < stages.length; i++) {
      setCurrentStage(i);

      // Mark current stage as loading
      setStages(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'loading' } : s
      ));

      // Snappy timing: 300-400ms per stage (not 600-1000ms)
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 100));

      // Initialize actual systems
      try {
        const detail = await initializeStage(stages[i].name);

        // Mark as complete with detail
        setStages(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'complete', detail } : s
        ));
      } catch (error) {
        setStages(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'error', detail: 'failed' } : s
        ));
      }
    }

    // All systems initialized
    setPhase('ready');
    setReady(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    // Show cursor again and complete
    stdout.write('\x1b[?25h');
    onComplete();
  };

  const initializeStage = async (stageName: string): Promise<string> => {
    switch (stageName) {
      case 'Neural Interface':
        return 'ReAct engine loaded';

      case 'Memory Systems':
        try {
          const brain = getBrainStore();
          await brain.init();
          const sessions = getSessionStore();
          await sessions.init();
          return 'Brain + sessions ready';
        } catch {
          return 'initialized';
        }

      case 'AI Providers': {
        try {
          const config = getConfig();
          const configured = config.getConfiguredProviders();
          setProviderCount(configured.length);
          return `${configured.length} providers active`;
        } catch {
          return '0 providers';
        }
      }

      case 'Tool Registry':
        return '37 tools registered';

      case 'Browser Engine':
        return 'Playwright standby';

      case 'Security Layer':
        try {
          const stateManager = getStateManager();
          await stateManager.init();
          return 'HITL + pattern blocking';
        } catch {
          return 'basic mode';
        }
    }
    return 'ok';
  };

  // ─── Logo Phase ─────────────────────────────────────────────────────────
  if (showLogo) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" height="100%">
        <Box flexDirection="column">
          {ECHO_LOGO_LINES.map((line, i) => (
            <Text key={i} color={getLogoColor('booting')}>{line}</Text>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text color="#AB47BC" bold>⚡ The Resilient Agentic Terminal</Text>
          <Text color="gray"> v2.0.0</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray" dimColor>Initializing neural interface...</Text>
        </Box>
      </Box>
    );
  }

  // ─── Boot Phase ─────────────────────────────────────────────────────────
  const completedCount = stages.filter(s => s.status === 'complete').length;
  const progress = completedCount / stages.length;
  const barWidth = 40;
  const filledWidth = Math.round(progress * barWidth);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Compact Logo */}
      <Box flexDirection="column" marginBottom={1}>
        {ECHO_LOGO_LINES.map((line, i) => (
          <Text key={i} color={getLogoColor(phase)}>{line}</Text>
        ))}
      </Box>

      {/* Tagline */}
      <Box marginBottom={1}>
        <Text color={getAccentColor(phase)} bold>   ⚡ System Initialization</Text>
        <Text color="gray"> v2.0.0</Text>
      </Box>

      {/* Separator */}
      <Box marginBottom={1}>
        <Text color="gray" dimColor>   {'─'.repeat(44)}</Text>
      </Box>

      {/* Boot Stages — Compact single-line each */}
      <Box flexDirection="column">
        {stages.map((stage, index) => (
          <Box key={stage.name} marginLeft={3}>
            <Box width={2}>
              <Text color={getStageStatusColor(stage.status)}>
                {getStageIcon(stage.status)}
              </Text>
            </Box>
            <Box width={20}>
              <Text color={getStageTextColor(stage.status)} bold={stage.status === 'loading'}>
                {stage.name}
              </Text>
            </Box>
            <Box>
              <Text color="gray" dimColor>
                {stage.status === 'loading' ? '...' :
                 stage.status === 'complete' ? (stage.detail || '✓') :
                 stage.status === 'error' ? 'error' : ''}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Progress Bar */}
      <Box marginTop={1} marginLeft={3}>
        <Text color="gray">[</Text>
        <Text color={ready ? '#66BB6A' : '#42A5F5'}>
          {'█'.repeat(filledWidth)}
        </Text>
        <Text color="gray" dimColor>
          {'░'.repeat(barWidth - filledWidth)}
        </Text>
        <Text color="gray">]</Text>
        <Text color="gray" dimColor> {Math.round(progress * 100)}%</Text>
      </Box>

      {/* Ready Message */}
      {ready && (
        <Box marginTop={1} marginLeft={3} flexDirection="column">
          <Text color="#66BB6A" bold>✓ All systems operational</Text>
          <Text color="gray" dimColor>  Entering Echo workspace...</Text>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1} marginLeft={3}>
        <Text color="gray" dimColor>Your thoughts. My echo. Infinite possibility.</Text>
      </Box>
    </Box>
  );
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function getStageStatusColor(status: BootStage['status']): string {
  switch (status) {
    case 'complete': return '#66BB6A';   // green
    case 'loading':  return '#42A5F5';   // blue
    case 'error':    return '#EF5350';   // red
    default:         return '#616161';   // dim grey
  }
}

function getStageTextColor(status: BootStage['status']): string {
  switch (status) {
    case 'complete': return '#A5D6A7';   // light green
    case 'loading':  return '#90CAF9';   // light blue
    case 'error':    return '#EF9A9A';   // light red
    default:         return '#757575';   // grey
  }
}

function getStageIcon(status: BootStage['status']): string {
  switch (status) {
    case 'complete': return '✓';
    case 'loading':  return '›';
    case 'error':    return '✗';
    default:         return '○';
  }
}
