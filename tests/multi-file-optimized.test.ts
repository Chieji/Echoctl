import { findAndReplace, searchInFiles, createFiles, updateFiles, deleteFiles } from '../src/tools/multi-file.js';
import { readFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

describe('multi-file tools performance optimization', () => {
  const testDir = join(process.cwd(), 'temp-test-multi-file');

  beforeEach(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it('should create multiple files in parallel', async () => {
    const files = [
      { path: 'file1.txt', content: 'hello 1' },
      { path: 'file2.txt', content: 'hello 2' },
      { path: 'dir/file3.txt', content: 'hello 3' },
    ];

    const result = await createFiles(files, testDir);

    expect(result.success).toBe(true);
    expect(result.created).toHaveLength(3);
    expect(existsSync(join(testDir, 'file1.txt'))).toBe(true);
    expect(existsSync(join(testDir, 'file2.txt'))).toBe(true);
    expect(existsSync(join(testDir, 'dir/file3.txt'))).toBe(true);
  });

  it('should search in multiple files in parallel', async () => {
    await createFiles([
      { path: 'f1.txt', content: 'pattern match here' },
      { path: 'f2.txt', content: 'no match' },
      { path: 'f3.txt', content: 'another pattern match' },
    ], testDir);

    const results = await searchInFiles('pattern', ['f1.txt', 'f2.txt', 'f3.txt'], testDir);

    expect(results).toHaveLength(2);
    expect(results.find(r => r.path === 'f1.txt')?.matches).toBe(1);
    expect(results.find(r => r.path === 'f3.txt')?.matches).toBe(1);
  });

  it('should find and replace in multiple files in parallel', async () => {
    await createFiles([
      { path: 'f1.txt', content: 'foo bar' },
      { path: 'f2.txt', content: 'baz foo' },
    ], testDir);

    const result = await findAndReplace('foo', 'qux', ['f1.txt', 'f2.txt'], testDir);

    expect(result.success).toBe(true);
    expect(result.edited).toHaveLength(2);

    const c1 = await readFile(join(testDir, 'f1.txt'), 'utf-8');
    const c2 = await readFile(join(testDir, 'f2.txt'), 'utf-8');

    expect(c1).toBe('qux bar');
    expect(c2).toBe('baz qux');
  });

  it('should update multiple files in parallel', async () => {
    await createFiles([
      { path: 'f1.txt', content: 'old 1' },
      { path: 'f2.txt', content: 'old 2' },
    ], testDir);

    const result = await updateFiles([
      { path: 'f1.txt', content: 'new 1' },
      { path: 'f2.txt', content: 'new 2' },
    ], testDir);

    expect(result.success).toBe(true);
    expect(result.edited).toHaveLength(2);

    const c1 = await readFile(join(testDir, 'f1.txt'), 'utf-8');
    const c2 = await readFile(join(testDir, 'f2.txt'), 'utf-8');

    expect(c1).toBe('new 1');
    expect(c2).toBe('new 2');
  });

  it('should delete multiple files in parallel', async () => {
    await createFiles([
      { path: 'f1.txt', content: 'to delete' },
      { path: 'f2.txt', content: 'to delete' },
    ], testDir);

    const result = await deleteFiles(['f1.txt', 'f2.txt'], testDir);

    expect(result.success).toBe(true);
    expect(result.deleted).toHaveLength(2);
    expect(existsSync(join(testDir, 'f1.txt'))).toBe(false);
    expect(existsSync(join(testDir, 'f2.txt'))).toBe(false);
  });

  it('should maintain deterministic order of results', async () => {
    const files = [
      { path: 'a.txt', content: 'content a' },
      { path: 'b.txt', content: 'content b' },
      { path: 'c.txt', content: 'content c' },
    ];
    await createFiles(files, testDir);

    const searchResults = await searchInFiles('content', ['a.txt', 'b.txt', 'c.txt'], testDir);
    expect(searchResults.map(r => r.path)).toEqual(['a.txt', 'b.txt', 'c.txt']);

    const replaceResult = await findAndReplace('content', 'new', ['a.txt', 'b.txt', 'c.txt'], testDir);
    expect(replaceResult.edited).toEqual(['a.txt', 'b.txt', 'c.txt']);

    const updateResult = await updateFiles([
      { path: 'a.txt', content: 'updated a' },
      { path: 'b.txt', content: 'updated b' },
      { path: 'c.txt', content: 'updated c' },
    ], testDir);
    expect(updateResult.edited).toEqual(['a.txt', 'b.txt', 'c.txt']);
  });
});
