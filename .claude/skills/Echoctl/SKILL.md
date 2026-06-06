```markdown
# Echoctl Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the Echoctl TypeScript codebase. It covers file naming, import/export styles, commit message habits, and testing patterns, providing practical guidance for contributing code that aligns with the project's standards.

## Coding Conventions

### File Naming
- **PascalCase** is used for file names.
  - Example: `EchoService.ts`, `UserManager.ts`

### Import Style
- **Alias imports** are preferred.
  - Example:
    ```typescript
    import EchoService from '@services/EchoService';
    ```

### Export Style
- **Mixed exports**: Both default and named exports are used.
  - Example:
    ```typescript
    // Default export
    export default EchoService;

    // Named export
    export const ECHO_CONSTANT = 'echo';
    ```

### Commit Messages
- **Freeform style** (no strict prefixes)
- **Average length:** 53 characters
  - Example:  
    ```
    Add support for new echo endpoint in EchoService
    ```

## Workflows

### Adding a New Feature
**Trigger:** When implementing new functionality.
**Command:** `/add-feature`

1. Create a new PascalCase file for the feature.
2. Use alias imports for dependencies.
3. Export the main class or function as default; use named exports for constants or helpers.
4. Write a corresponding test file named `FeatureName.test.ts`.
5. Commit changes with a clear, concise message.

### Refactoring Code
**Trigger:** When improving or restructuring existing code.
**Command:** `/refactor`

1. Identify the code to refactor.
2. Update file names to PascalCase if needed.
3. Ensure all imports use aliases.
4. Adjust exports to match the mixed export style.
5. Update or add tests as necessary.
6. Commit with a descriptive message.

### Writing Tests
**Trigger:** When adding or updating tests.
**Command:** `/write-test`

1. Create a test file with the pattern `FeatureName.test.ts`.
2. Use the project's preferred (unknown) testing framework.
3. Cover all new or changed functionality.
4. Commit with a message indicating the test coverage.

## Testing Patterns

- **Test files** follow the pattern: `*.test.*` (e.g., `EchoService.test.ts`)
- **Testing framework** is not specified; follow existing patterns in the repo.
- Place test files alongside or near the code they test.

  Example:
  ```typescript
  // EchoService.test.ts
  import EchoService from '@services/EchoService';

  describe('EchoService', () => {
    it('should echo input', () => {
      expect(EchoService.echo('hello')).toBe('hello');
    });
  });
  ```

## Commands
| Command        | Purpose                                      |
|----------------|----------------------------------------------|
| /add-feature   | Scaffold and implement a new feature         |
| /refactor      | Refactor existing code following conventions |
| /write-test    | Add or update tests for a feature            |
```
