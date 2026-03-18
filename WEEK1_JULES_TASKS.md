# WEEK 1: ECHOMEN PROVIDER SYSTEM - JULES TASKS
**Status**: Ready for automated execution
**Total Work**: 40 hours (7 AI providers)
**Auto-commit**: Yes (Jules will handle)

---

## ARCHITECTURE DECISION (Claude ↔ User)

### Target: Multi-Provider AIBridge with Smart Routing
```typescript
class AIBridge {
  // Support all 7 providers with fallback
  async generateResponse(provider: string, messages: Message[]) {
    // Implementation per provider
  }

  // Auto-select best provider by task
  async smartRoute(taskType: string, messages: Message[]) {
    // Route logic
  }
}
```

**Provider Coverage**:
1. ✅ Gemini (already working)
2. Groq (fast chat)
3. Together AI (code generation)
4. Cohere (analysis)
5. OpenRouter (general)
6. Mistral (reasoning)
7. HuggingFace (specialized)

---

## TASK 1: Groq Provider Implementation
**Assigned To**: Jules
**Complexity**: Medium (SDK already installed)
**Time**: 5-6 hours
**Success Criteria**: ./test-providers groq → ✅ passes

### Context Jules Needs

**File Location**: `ECHOMEN/lib/ai_bridge.ts`

**Current State**:
```typescript
// Current (only Gemini)
export class AIBridge {
  async generateResponse(provider: string, messages: Message[]) {
    if (provider === 'gemini') {
      return await this.geminiClient.generateContent(messages);
    }
    throw new Error('Provider not implemented');
  }
}
```

**Deliverable**:
```typescript
// Add Groq support
private async groqGenerate(messages: Message[]): Promise<Response> {
  // Use groq-sdk
  // Handle rate limits (20 requests/min free tier)
  // Parse response correctly
  // Return {success, content, tokens}
}

// Update switch statement
case 'groq':
  return await this.groqGenerate(messages);
```

**API Key Location**:
- Check: `process.env.GROQ_API_KEY`
- Fallback: User prompt if not set

**Error Handling**:
- Catch rate limits (429 errors)
- Catch auth errors (401)
- Graceful fallback to next provider

**Tests Jules Should Add**:
```typescript
describe('GroqProvider', () => {
  test('generates response correctly', async () => {
    const response = await bridge.generateResponse('groq',
      [{role: 'user', content: 'Hello'}]);
    expect(response.success).toBe(true);
    expect(response.content).toBeTruthy();
  });

  test('handles rate limits', async () => {
    // Simulate 429 error
    // Verify fallback triggered
  });
});
```

**Git Commit Message**:
`feat: Implement Groq provider with rate limit handling`

---

## TASK 2: Together AI Provider
**Assigned To**: Jules
**Time**: 5-6 hours
**Specialty**: Code generation (best for coding tasks)

**Deliverable**:
- togetherGenerate() function
- Handle streaming (Together supports it)
- Cost tracking (tokens × rate)
- Switch case in AIBridge

**Special Logic**:
```typescript
// Together is best for code - detect and suggest
if (messages.some(m => m.content.includes('code') || m.content.includes('implement'))) {
  return 'together';  // In routing logic
}
```

**Commit**: `feat: Implement Together AI provider with streaming support`

---

## TASK 3: Cohere Provider
**Assigned To**: Jules
**Time**: 4-5 hours
**Specialty**: Data analysis, classification

**Deliverable**:
- cohereGenerate() function
- Support document classification if available
- Cost tracking
- Switch case

**Commit**: `feat: Implement Cohere provider for analysis tasks`

---

## TASK 4: OpenRouter Provider
**Assigned To**: Jules
**Time**: 5-6 hours
**Specialty**: General purpose, access to multiple models

**Deliverable**:
- openrouterGenerate() function
- Model selection if needed
- Fallback support
- Switch case

**Special Logic**:
```typescript
// OpenRouter provides fallback if primary fails
// Can use as safety net
```

**Commit**: `feat: Implement OpenRouter provider with fallback chain`

---

## TASK 5: Mistral Provider
**Assigned To**: Jules
**Time**: 4-5 hours
**Specialty**: Complex reasoning

**Deliverable**:
- mistralGenerate() function
- Switch case

**Commit**: `feat: Implement Mistral provider for reasoning tasks`

---

## TASK 6: HuggingFace Provider
**Assigned To**: Jules
**Time**: 5-6 hours
**Specialty**: Specialized models, open source

**Deliverable**:
- huggingfaceGenerate() function
- Model endpoint handling
- Switch case

**Commit**: `feat: Implement HuggingFace provider for specialized models`

---

## TASK 7: Provider Routing Logic
**Assigned To**: Jules
**Time**: 8-10 hours
**Complexity**: High (decision logic, health checks, cost optimization)

**File to Create**: `ECHOMEN/services/smartRoute.ts`

**Deliverable**:
```typescript
export class ProviderRouter {
  // Select best provider by task type
  selectProvider(taskType: string, availableProviders: string[]): string {
    const routes = {
      'chat': 'groq',          // Fastest
      'code': 'together',       // Best for code
      'analysis': 'cohere',     // Data processing
      'reasoning': 'mistral',   // Complex thinking
      'general': 'gemini',      // Default
    };
    return routes[taskType] || 'gemini';
  }

  // Track provider health
  updateProviderHealth(provider: string, success: boolean, latency: number) {
    // Store metrics
  }

  // Auto-select with health awareness
  async selectBestProvider(taskType: string): Promise<string> {
    // Check health metrics
    // Prefer healthy providers
    // Fallback if needed
  }
}
```

**Health Tracking**:
- Response latency
- Success rate
- Cost per response
- Error frequency

**Commit**: `feat: Add intelligent provider routing with health tracking`

---

## TASK 8: Provider Tests & Validation
**Assigned To**: Jules (test implementation)
**Assigned To**: Qwen/Gemini CLI (test validation)
**Time**: 6-8 hours

**Deliverable**: `ECHOMEN/__tests__/providers.test.ts`

```typescript
describe('All Providers', () => {
  const providers = ['gemini', 'groq', 'together', 'cohere', 'openrouter', 'mistral', 'huggingface'];

  providers.forEach(provider => {
    test(`${provider} generates valid response`, async () => {
      const response = await bridge.generateResponse(provider,
        [{role: 'user', content: 'Say hello'}]);
      expect(response.success).toBe(true);
      expect(response.content).toBeTruthy();
    });
  });

  test('routing selects appropriate provider', async () => {
    expect(router.selectProvider('code')).toBe('together');
    expect(router.selectProvider('chat')).toBe('groq');
  });

  test('fallback works when provider fails', async () => {
    // Mock provider failure
    // Verify fallback triggered
  });
});
```

**Commit**: `test: Add comprehensive provider tests`

---

## TASK 9: Documentation & Debugging
**Assigned To**: Jules (basic doc)
**Assigned To**: Claude (final review)
**Time**: 2-3 hours

**Deliverable**: `ECHOMEN/PROVIDER_SETUP.md`
```markdown
# Provider Setup Guide

## Required API Keys
- GROQ_API_KEY
- TOGETHER_API_KEY
- COHERE_API_KEY
- OPENROUTER_API_KEY
- MISTRAL_API_KEY
- HUGGINGFACE_API_TOKEN

## Testing Providers
npm run test:providers

## Performance Metrics
...
```

**Commit**: `docs: Add provider setup and testing guide`

---

## EXECUTION FLOW FOR JULES

```
1. Clone/Pull latest
2. TASK 1: Implement Groq
   - Run tests
   - If pass → commit
   - If fail → output errors for Claude review
3. TASK 2-6: Implement each provider in sequence
   - Same test/commit cycle
4. TASK 7: Implement routing logic
5. TASK 8: Run full test suite
   - If pass → commit
   - If fail → hold for Claude review
6. TASK 9: Generate documentation
7. Final: Push to GitHub

If ANY task fails:
- Output error details
- Wait for Claude guidance
- Resume after feedback
```

---

## FILES TO CREATE/MODIFY

```
ECHOMEN/
├── lib/
│   ├── ai_bridge.ts (MODIFY - add all 7 providers)
│   └── types.ts (VERIFY - ensure Response type defined)
├── services/
│   └── smartRoute.ts (CREATE - routing logic)
├── __tests__/
│   └── providers.test.ts (CREATE - comprehensive tests)
└── PROVIDER_SETUP.md (CREATE - documentation)
```

---

## VALIDATION CHECKLIST

After each task, verify:
- ✅ Code compiles without errors
- ✅ Unit tests pass
- ✅ Response format consistent
- ✅ Error handling graceful
- ✅ No hardcoded values (use env vars)
- ✅ Commit message clear

---

## SUCCESS CRITERIA (End of Week 1)

```
✅ All 7 providers implemented
✅ Each provider tested individually
✅ Routing logic selects best provider
✅ Health tracking working
✅ Tests pass with 80%+ coverage
✅ Commits pushed to GitHub
✅ No API token waste
```

---

## NEXT SESSION (Week 2)

If all tasks complete:
→ Move to **IPC Protocol Implementation** (CLI ↔ Browser communication)

If any blockers:
→ Claude reviews, provides guidance, resume

