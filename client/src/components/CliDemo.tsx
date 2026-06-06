/**
 * CliDemo.tsx
 * 
 * Code review fixes applied (PR #68 — Sourcery + Gemini bots):
 * [Sourcery #1] DEMO_STEPS hoisted to module scope — zero re-allocation on render
 * [Sourcery #2] O(n²) array copy replaced with integer index + slice — O(1) state update  
 * [Gemini  #1] Async for-loop + isMounted ref replaced with useEffect + clearTimeout
 * [Gemini  #2] terminalRef added for auto-scroll as output grows
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ── [Sourcery #1 Fix] ─────────────────────────────────────────────────────────
// Module-level constant. Allocated once. Never touched again on re-render.
const DEMO_STEPS: string[] = [
  '$ echoctl scan --target api.example.com --deep',
  '⟳ Initializing ECHOMEN threat scanner...',
  '📡 Connecting to threat intelligence database...',
  '✓ Connected to threat database (v2.8.1)',
  '',
  '⟳ Phase 1: Endpoint Discovery',
  '  ✓ Found 12 endpoints',
  '  ✓ Analyzing endpoint signatures',
  '',
  '⟳ Phase 2: Vulnerability Scanning',
  '  → GET /api/auth (200 OK)',
  '  → POST /api/users (201 Created)',
  '  → GET /api/admin (403 Forbidden)',
  '  → GET /api/search?q=test (200 OK) ⚠️',
  '',
  '⟳ Phase 3: Dependency Analysis',
  '  ✓ Scanned 127 dependencies',
  '  ⚠️  Found 3 vulnerabilities:',
  '    - lodash@4.17.15 (CVE-2021-23337)',
  '    - express@4.17.1 (Prototype pollution)',
  '    - axios@0.21.1 (SSRF in redirect handling)',
  '',
  '⟳ Phase 4: Security Headers Analysis',
  '  ✗ Missing: Content-Security-Policy',
  '  ✗ Missing: X-Frame-Options',
  '  ✗ Missing: Strict-Transport-Security',
  '  ✓ Present: X-Content-Type-Options',
  '',
  '⟳ Phase 5: Auth & Authorization',
  '  ⚠️  JWT tokens lack expiration validation',
  '  ⚠️  CORS allows all origins (*)',
  '  ✓ Password hashing: bcrypt (good)',
  '',
  '═══════════════════════════════════════',
  '📊 SCAN RESULTS',
  '═══════════════════════════════════════',
  'Threat Level: HIGH 🔴',
  'Critical Issues: 3',
  'High Priority: 5',
  'Scan Duration: 3.2s',
  '',
  '💡 TOP RECOMMENDATIONS:',
  '  1. Update lodash to 4.17.21+',
  '  2. Add security headers middleware',
  '  3. Implement CORS whitelist',
  '  4. Add JWT expiration validation',
  '',
  '✓ Report saved: .echomen/scan-report.json',
  '✓ Scan completed successfully',
];

export function CliDemo() {
  // ── [Sourcery #2 Fix] ───────────────────────────────────────────────────────
  // Integer index, not a growing array. slice() is O(1). No O(n²) copies.
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // ── [Gemini #2 Fix] ────────────────────────────────────────────────────────
  const terminalRef = useRef<HTMLDivElement>(null);

  // ── [Gemini #1 Fix] ────────────────────────────────────────────────────────
  // Declarative timer. useEffect cleanup = no dangling timers on unmount.
  // Works correctly in React 18 StrictMode double-invocation.
  useEffect(() => {
    if (!isRunning) return;
    if (stepIndex >= DEMO_STEPS.length) {
      setIsRunning(false);
      return;
    }
    const timer = setTimeout(() => setStepIndex(i => i + 1), 100);
    return () => clearTimeout(timer); // ← unmount safe
  }, [isRunning, stepIndex]);

  // Auto-scroll as new lines appear
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [stepIndex]);

  const startDemo = () => {
    setStepIndex(0);
    setIsRunning(true);
  };

  // Derived — O(1) state read, O(n) slice
  const visible = DEMO_STEPS.slice(0, stepIndex);

  return (
    <div className="relative rounded-lg border border-border bg-background shadow-2xl overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-muted border-b border-border">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-500" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-2 text-xs text-muted-foreground font-mono">
          echoctl — threat scanner
        </span>
      </div>

      {/* Terminal output */}
      <div ref={terminalRef} className="bg-card p-6 font-mono text-sm h-96 overflow-y-auto">
        {visible.length === 0 && !isRunning && (
          <p className="text-muted-foreground text-center py-20">
            Click &ldquo;Run Demo&rdquo; to start
          </p>
        )}

        {visible.map((line, idx) => (
          <motion.div
            key={`step-${idx}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`py-0.5 ${
              line.includes('✓') ? 'text-green-500' :
              line.includes('⚠️') ? 'text-yellow-500' :
              line.includes('✗') || line.includes('❌') ? 'text-red-500' :
              line.startsWith('$') ? 'text-primary font-bold' :
              'text-foreground'
            }`}
          >
            {line || '\u00A0'}
          </motion.div>
        ))}

        {isRunning && <div className="text-primary animate-pulse">▌</div>}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-muted border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          {isRunning
            ? `Scanning… ${stepIndex}/${DEMO_STEPS.length}`
            : stepIndex >= DEMO_STEPS.length
            ? '✓ Complete'
            : 'Ready'}
        </span>
        <button
          onClick={startDemo}
          disabled={isRunning}
          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {isRunning ? 'Running…' : stepIndex > 0 ? 'Run Again' : 'Run Demo'}
        </button>
      </div>
    </div>
  );
}
