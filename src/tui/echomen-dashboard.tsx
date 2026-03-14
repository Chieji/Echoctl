/**
 * ECHOMEN Dashboard - Main Entry Point
 * Launches the full cognitive agent experience
 */

import React from 'react';
import { render } from 'ink';
import { EchomenApp } from './echomen-app.js';
import { ViewMode } from './types.js';

interface DashboardProps {
  initialMode?: ViewMode;
}

/**
 * Main ECHOMEN Dashboard Component
 */
export const Dashboard: React.FC<DashboardProps> = ({ initialMode = 'chat' }) => {
  return <EchomenApp initialMode={initialMode} />;
};

/**
 * Launch the interactive dashboard
 */
export async function launchDashboard(): Promise<void> {
  const { waitUntilExit } = render(<Dashboard />);
  await waitUntilExit();
}
