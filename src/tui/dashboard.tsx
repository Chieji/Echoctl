/**
 * Interactive Dashboard with Ink (React for CLI)
 * Real-time monitoring and control
 */

import React, { useState, useEffect } from 'react';
import { render, Box, Text, Newline, useStdout, useInput } from 'ink';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { getConfig } from '../utils/config.js';
import { getSessionStore } from '../storage/sessions.js';
import { getBrainStore } from '../storage/brain.js';
import { getApprovalsStore } from '../storage/approvals.js';

interface ProviderStatus {
  name: string;
  configured: boolean;
}

interface DashboardStats {
  sessions: number;
  messages: number;
  tokens: number;
  memories: number;
  pendingApprovals: number;
}

const Dashboard: React.FC = () => {
  const { stdout } = useStdout();
  const [stats, setStats] = useState<DashboardStats>({
    sessions: 0,
    messages: 0,
    tokens: 0,
    memories: 0,
    pendingApprovals: 0,
  });
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState(0);
  const [exitRequested, setExitRequested] = useState(false);

  const tabs = ['Overview', 'Providers', 'Sessions', 'Brain', 'Approvals'];

  // Handle keyboard input
  useInput((input, key) => {
    if (key.tab) {
      setSelectedTab((prev) => (prev + 1) % tabs.length);
    }
    if (input === 'q' || input === 'Q' || key.ctrl && input === 'c') {
      setExitRequested(true);
      process.exit(0);
    }
    if (input === '1') setSelectedTab(0);
    if (input === '2') setSelectedTab(1);
    if (input === '3') setSelectedTab(2);
    if (input === '4') setSelectedTab(3);
    if (input === '5') setSelectedTab(4);
  });

  // Update stats periodically
  useEffect(() => {
    const updateStats = async () => {
      const config = getConfig();
      const sessions = getSessionStore();
      const brain = getBrainStore();
      const approvals = getApprovalsStore();

      await sessions.init();
      await brain.init();
      await approvals.init();

      const sessionStats = await sessions.getStats();
      const brainStats = brain.getStats();
      const approvalStats = approvals.getStats();

      const providerList: ProviderStatus[] = [
        { name: 'Gemini', configured: config.isProviderConfigured('gemini') },
        { name: 'OpenAI', configured: config.isProviderConfigured('openai') },
        { name: 'Claude', configured: config.isProviderConfigured('anthropic') },
        { name: 'Qwen', configured: config.isProviderConfigured('qwen') },
        { name: 'Ollama', configured: config.isProviderConfigured('ollama') },
        { name: 'Groq', configured: config.isProviderConfigured('groq') },
        { name: 'DeepSeek', configured: config.isProviderConfigured('deepseek') },
        { name: 'Kimi', configured: config.isProviderConfigured('kimi') },
        { name: 'OpenRouter', configured: config.isProviderConfigured('openrouter') },
        { name: 'Together', configured: config.isProviderConfigured('together') },
        { name: 'ModelScope', configured: config.isProviderConfigured('modelscope') },
        { name: 'Mistral', configured: config.isProviderConfigured('mistral') },
        { name: 'HuggingFace', configured: config.isProviderConfigured('huggingface') },
        { name: 'GitHub', configured: config.isProviderConfigured('github') },
      ];

      setProviders(providerList);
      setStats({
        sessions: sessionStats.totalSessions,
        messages: sessionStats.totalMessages,
        tokens: sessionStats.totalTokens,
        memories: brainStats.totalMemories,
        pendingApprovals: approvalStats.pending,
      });
      setCurrentTime(new Date());
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const configuredCount = providers.filter(p => p.configured).length;

  const renderHeader = () => (
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        {gradient.pastel.multiline('╔════════════════════════════════════════════════════════════╗')}
      </Text>
      <Text>
        {gradient.pastel.multiline('║') + ' '}
        {chalk.white.bold('ECHO DASHBOARD - The Resilient Agentic Terminal')}
        {gradient.pastel.multiline('║')}
      </Text>
      <Text>
        {gradient.pastel.multiline('╚════════════════════════════════════════════════════════════╝')}
      </Text>
      <Newline />
      <Text>
        <Text color="gray">Time: </Text>
        <Text color="white">{currentTime.toLocaleString()}</Text>
        <Text>  |  </Text>
        <Text color="gray">Status: </Text>
        <Text color="green">● Online</Text>
        <Text>  |  </Text>
        <Text color="gray">Providers: </Text>
        <Text color="cyan">{configuredCount}/14</Text>
      </Text>
    </Box>
  );

  const renderTabs = () => (
    <Box marginBottom={1}>
      {tabs.map((tab, index) => (
        <Box
          key={tab}
          backgroundColor={index === selectedTab ? 'cyan' : undefined}
          padding={index === selectedTab ? 1 : 0}
          marginRight={1}
        >
          <Text
            color={index === selectedTab ? 'black' : 'gray'}
          >
            {index + 1}. {tab}
          </Text>
        </Box>
      ))}
      <Text color="dim"> [Tab to switch, Q to exit]</Text>
    </Box>
  );

  const renderOverview = () => (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="magenta" padding={1} marginBottom={1}>
        <Text bold color="magenta">📊 Statistics</Text>
        <Newline />
        <Text>  Sessions: <Text color="cyan">{stats.sessions}</Text></Text>
        <Newline />
        <Text>  Messages: <Text color="cyan">{stats.messages}</Text></Text>
        <Newline />
        <Text>  Tokens: <Text color="cyan">{stats.tokens.toLocaleString()}</Text></Text>
        <Newline />
        <Text>  Memories: <Text color="cyan">{stats.memories}</Text></Text>
        <Newline />
        <Text>  Pending Approvals: <Text color={stats.pendingApprovals > 0 ? 'yellow' : 'green'}>{stats.pendingApprovals}</Text></Text>
      </Box>

      <Box borderStyle="round" borderColor="green" padding={1}>
        <Text bold color="green">⚡ Quick Commands</Text>
        <Newline />
        <Text dimColor>  echo chat "message"     - Start conversation</Text>
        <Newline />
        <Text dimColor>  echo chat --agent       - Agent mode</Text>
        <Newline />
        <Text dimColor>  echo plugin sync-all    - Sync plugins</Text>
        <Newline />
        <Text dimColor>  echo auth sync          - Auto-detect credentials</Text>
      </Box>
    </Box>
  );

  const renderProviders = () => (
    <Box borderStyle="round" borderColor="cyan" padding={1} flexDirection="column">
      <Text bold color="cyan">🔌 Provider Status</Text>
      <Newline />
      <Box flexDirection="column">
        {providers.map((provider, index) => (
          <Box key={provider.name} marginBottom={0}>
            <Text>
              {provider.configured ? (
                <Text color="green">●</Text>
              ) : (
                <Text color="gray">○</Text>
              )}
              <Text> </Text>
              <Text color={provider.configured ? 'white' : 'gray'}>{provider.name}</Text>
              {index % 2 === 0 && index < providers.length - 1 && (
                <Text dimColor>  |  </Text>
              )}
              {index % 2 === 1 && <Newline />}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderSessions = () => (
    <Box borderStyle="round" borderColor="blue" padding={1} flexDirection="column">
      <Text bold color="blue">📁 Sessions</Text>
      <Newline />
      <Text>  Total Sessions: <Text color="cyan">{stats.sessions}</Text></Text>
      <Newline />
      <Text>  Total Messages: <Text color="cyan">{stats.messages}</Text></Text>
      <Newline />
      <Text dimColor>  Use 'echo sessions' to view details</Text>
    </Box>
  );

  const renderBrain = () => (
    <Box borderStyle="round" borderColor="yellow" padding={1} flexDirection="column">
      <Text bold color="yellow">🧠 Second Brain</Text>
      <Newline />
      <Text>  Total Memories: <Text color="cyan">{stats.memories}</Text></Text>
      <Newline />
      <Text dimColor>  Use 'echo brain' commands to manage knowledge</Text>
    </Box>
  );

  const renderApprovals = () => (
    <Box borderStyle="round" borderColor={stats.pendingApprovals > 0 ? 'yellow' : 'green'} padding={1} flexDirection="column">
      <Text bold color={stats.pendingApprovals > 0 ? 'yellow' : 'green'}>
        🔐 HITL Approvals
      </Text>
      <Newline />
      {stats.pendingApprovals > 0 ? (
        <>
          <Text color="yellow">⚠ {stats.pendingApprovals} pending approval(s)</Text>
          <Newline />
          <Text dimColor>  Use 'echo approve list' to view</Text>
        </>
      ) : (
        <Text color="green">✓ No pending approvals</Text>
      )}
    </Box>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 0:
        return renderOverview();
      case 1:
        return renderProviders();
      case 2:
        return renderSessions();
      case 3:
        return renderBrain();
      case 4:
        return renderApprovals();
      default:
        return renderOverview();
    }
  };

  if (exitRequested) {
    return <Text color="green">Goodbye!</Text>;
  }

  return (
    <Box flexDirection="column">
      {renderHeader()}
      {renderTabs()}
      {renderContent()}
      <Newline />
      <Text dimColor>Press Tab to switch tabs | Q to exit</Text>
    </Box>
  );
};

/**
 * Launch the interactive dashboard
 */
export async function launchDashboard(): Promise<void> {
  const { waitUntilExit } = render(<Dashboard />);
  await waitUntilExit();
}
