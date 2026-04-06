```markdown
# Echoctl Development Patterns

> Auto-generated skill from repository analysis

## Overview
Echoctl is a TypeScript codebase focused on file and utility operations, with an emphasis on performance and reliability. While it does not use a specific framework, it demonstrates clear coding conventions and includes workflows for optimizing multi-file operations. Testing is present, though the framework is not explicitly identified.

## Coding Conventions

- **File Naming:**  
  Use camelCase for file names.  
  _Example:_  
  ```
  src/tools/multiFile.ts
  ```

- **Import Style:**  
  Use relative imports for modules within the project.  
  _Example:_  
  ```typescript
  import { readFiles } from './fileUtils';
  ```

- **Export Style:**  
  Use named exports for all modules.  
  _Example:_  
  ```typescript
  export function readFiles(paths: string[]): Promise<string[]> { ... }
  ```

## Workflows

### Parallelize Multi-File Operations
**Trigger:** When someone wants to optimize multi-file operations for speed and reliability.  
**Command:** `/parallelize-multi-file`

1. Refactor functions in `src/tools/multi-file.ts` to use `Promise.all` or similar parallelization for I/O operations.
2. Ensure that the output order is deterministic (matches input order).
3. Replace any shell-based file operations with native Node.js `fs/promises` equivalents.
4. Add or update tests in `tests/multi-file-optimized.test.ts` to verify new behavior and output order.

_Example:_

**Before:**
```typescript
// Sequential file reading
export async function readFiles(paths: string[]): Promise<string[]> {
  const results = [];
  for (const path of paths) {
    results.push(await fs.readFile(path, 'utf8'));
  }
  return results;
}
```

**After:**
```typescript
// Parallelized file reading
export async function readFiles(paths: string[]): Promise<string[]> {
  return Promise.all(paths.map(path => fs.readFile(path, 'utf8')));
}
```

## Testing Patterns

- **Test File Naming:**  
  Test files use the `*.test.*` pattern.  
  _Example:_  
  ```
  tests/multi-file-optimized.test.ts
  ```

- **Testing Framework:**  
  The specific framework is not identified, but tests are colocated in a `tests/` directory and follow standard TypeScript test patterns.

- **Test Focus:**  
  Tests are updated or added in parallel with code changes, especially when refactoring for performance or determinism.

## Commands

| Command                  | Purpose                                                      |
|--------------------------|--------------------------------------------------------------|
| /parallelize-multi-file  | Refactor multi-file utilities for parallelized I/O and update tests |
```
