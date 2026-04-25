```markdown
# Echoctl Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill introduces the development patterns and conventions used in the Echoctl TypeScript codebase. Echoctl is a TypeScript project with no detected framework, focusing on clear file organization, consistent code style, and a pragmatic approach to testing. This guide will help you quickly understand how to contribute code, structure files, and run or write tests in this repository.

## Coding Conventions

### File Naming
- Use **PascalCase** for all file names.
  - Example: `UserService.ts`, `EchoController.ts`

### Import Style
- Use **alias imports** to reference modules.
  - Example:
    ```typescript
    import { EchoService as Service } from './EchoService';
    ```

### Export Style
- Both **named** and **default exports** are used.
  - Named export example:
    ```typescript
    export function echo(input: string): string {
      return input;
    }
    ```
  - Default export example:
    ```typescript
    export default class EchoController { ... }
    ```

### Commit Patterns
- Commit messages are **freeform** and may include prefixes, but there is no enforced structure.
- Average commit message length is about 61 characters.

## Workflows

### Adding a New Feature
**Trigger:** When implementing a new feature or module  
**Command:** `/add-feature`

1. Create a new file using PascalCase (e.g., `NewFeature.ts`).
2. Use alias imports for dependencies.
3. Export your feature using named or default export as appropriate.
4. Write corresponding test files as `NewFeature.test.ts`.
5. Commit with a descriptive message.

### Fixing a Bug
**Trigger:** When resolving a bug or issue  
**Command:** `/fix-bug`

1. Locate the relevant file(s) using PascalCase naming.
2. Apply the fix, maintaining import/export conventions.
3. Update or add test cases in `*.test.ts` files.
4. Commit with a clear, descriptive message.

### Writing Tests
**Trigger:** When adding or updating tests  
**Command:** `/write-test`

1. Create or update a test file named `ModuleName.test.ts`.
2. Follow the project's test structure (framework is unknown; check existing tests for style).
3. Ensure tests cover new or changed functionality.
4. Commit your changes.

## Testing Patterns

- Test files use the pattern `*.test.*` (e.g., `EchoService.test.ts`).
- The specific testing framework is **unknown**—review existing test files for guidance.
- Place tests alongside or near the modules they cover.
- Example test file structure:
  ```typescript
  // EchoService.test.ts
  import { echo } from './EchoService';

  describe('echo', () => {
    it('should return the input string', () => {
      expect(echo('hello')).toBe('hello');
    });
  });
  ```

## Commands
| Command      | Purpose                                      |
|--------------|----------------------------------------------|
| /add-feature | Scaffold and implement a new feature/module  |
| /fix-bug     | Apply a bug fix and update related tests     |
| /write-test  | Add or update tests for a module             |
```
