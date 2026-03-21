# BDI Cognitive Architecture for Echoctl

Echoctl v2.0 implements a full BDI (Belief, Desire, Intention) cognitive architecture, allowing for more structured, resilient, and autonomous task execution.

## 7-State Cognitive Loop

The engine cycles through seven primary states for every task execution (returning to IDLE when finished):

1.  **PERCEIVE**: The agent gathers information from its environment (CWD, Git, project structure) and retrieves relevant memories from the "Second Brain".
2.  **REASON**: The agent analyzes the user's goal and identifies constraints and technical intent.
3.  **PLAN**: The agent decomposes the high-level goal into a hierarchical Task Tree.
4.  **ACT**: The agent executes each task in the plan using the ReAct (Reason + Act) loop, utilizing available tools.
5.  **OBSERVE**: The agent captures the results of its actions and evaluates success or failure.
6.  **REFLECT**: The agent evaluates the strategy used and generates lessons learned.
7.  **LEARN**: The agent consolidates the experience into episodic and semantic memory.

## Architecture Components

- **Perceptor**: Updates beliefs based on current state and memory.
- **Reasoner**: Formulates high-level intentions from natural language.
- **Planner**: Decomposes intentions into granular subtasks.
- **Executor**: Carries out the plan using a robust ReAct loop.
- **Observer**: Monitors execution and detects failures.
- **Reflector**: Analyzes outcomes and strategies.
- **Learner**: Updates long-term memory with new knowledge.

## Safety and Halting

The engine includes `BDIHaltingGuards` to prevent infinite loops and ensure safety. It monitors iteration counts, execution duration, and security context.

## Keyboard Shortcuts (TUI)

- **Ctrl+P**: Open Command Palette (fuzzy search for commands and modes).
- **Ctrl+1**: Switch to Chat Mode.
- **Ctrl+2**: Switch to Agent Mode.
- **Ctrl+3**: Switch to Code Mode.
- **Ctrl+4**: Switch to Browser Mode.
- **Ctrl+5**: Switch to Memory Mode (Second Brain explorer).
- **Ctrl+C**: Exit the application.
