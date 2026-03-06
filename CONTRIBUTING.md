# CONTRIBUTING.md - How to Contribute to Echo

Thanks for wanting to improve Echo! Here's how to contribute.

---

## Quick Start

```bash
# Fork and clone
git clone https://github.com/your-username/echoctl.git
cd echoctl

# Install dependencies
npm install

# Start development
npm run dev

# Build
npm run build
```

---

## Development Workflow

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Follow existing code style
- Add tests for new features
- Update documentation

### 3. Test
```bash
# Run all tests
npm test

# Check types
npm run type-check

# Lint
npm run lint
```

### 4. Commit
```bash
# Use conventional commits
git commit -m "feat: add new provider support"
git commit -m "fix: resolve memory leak in token watcher"
git commit -m "docs: update README with examples"
```

### 5. Push and PR
```bash
git push origin feature/your-feature-name
# Then open a PR on GitHub
```

---

## Code Style

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types on functions
- Interfaces for object shapes

### Naming
```typescript
// Classes: PascalCase
class ProviderChain {}

// Functions: camelCase
function generateResponse() {}

// Constants: UPPER_CASE
const DEFAULT_TIMEOUT = 30000;

// Types: PascalCase
type ProviderName = 'openai' | 'gemini';
```

### File Structure
```
src/
├── commands/      # CLI commands
├── providers/     # AI provider implementations
├── tools/         # Tool executors
├── utils/         # Utilities
├── types/         # Type definitions
└── index.ts       # Entry point
```

---

## Adding a New Provider

1. Create `src/providers/newprovider.ts`:
```typescript
import { BaseProvider } from './base.js';

export class NewProviderProvider extends BaseProvider {
  readonly name: ProviderName = 'newprovider';
  
  async generateResponse(messages: Message[]): Promise<ProviderResponse> {
    // Implementation
  }
}
```

2. Update `src/providers/index.ts`:
```typescript
export { NewProviderProvider } from './newprovider.js';

// Add to createProvider switch
case 'newprovider':
  return new NewProviderProvider(apiKey, model);
```

3. Update `src/types/index.ts`:
```typescript
export type ProviderName = '...' | 'newprovider' | '...';
```

4. Update `src/utils/smart-mode.ts`:
```typescript
// Add to smart selection logic if applicable
```

5. Add tests in `tests/providers/newprovider.test.ts`

---

## Adding a New Tool

1. Create `src/tools/newtool.ts`:
```typescript
export async function newTool(param: string): Promise<ToolResult> {
  // Implementation
}
```

2. Export from `src/tools/executor.ts`:
```typescript
export { newTool } from './newtool.js';
```

3. Add to ReAct engine tool registry in `src/core/engine.ts`

4. Document in `TOOLS.md`

---

## Testing

### Unit Tests
```typescript
import { describe, it, expect } from '@jest/globals';

describe('ProviderChain', () => {
  it('should failover when primary fails', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```bash
# Test with real API (requires keys)
npm run test:integration
```

### Manual Testing
```bash
# Build and test locally
npm run build
node dist/index.js chat "test message"
```

---

## Documentation

### README.md
- Update feature list
- Add usage examples
- Update provider table

### Provider Docs
- Add to provider comparison table
- Document API requirements
- Add setup instructions

### Code Comments
- Explain _why_, not _what_
- Document complex logic
- Add examples for public APIs

---

## Pull Request Guidelines

### Title
- Clear and descriptive
- Use conventional commit format

### Description
- What does this PR do?
- Why is it needed?
- How was it tested?

### Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] TypeScript compiles
- [ ] Lint passes
- [ ] No breaking changes (or marked as such)

---

## Release Process

1. Version bump in `package.json`
2. Update `CHANGELOG.md`
3. Tag release
4. Publish to npm

---

## Questions?

- Open an issue for bugs
- Use discussions for questions
- Check existing issues before creating new ones

---

_Thanks for contributing to Echo! 🙏_
