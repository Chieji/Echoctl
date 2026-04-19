
import { createFiles, createBackup, deleteFiles, searchInFiles, findAndReplace, updateFiles } from '../dist/tools/multi-file.js';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs';
import assert from 'assert';

async function testCorrectness() {
  const testDir = mkdtempSync(join(tmpdir(), 'echo-test-'));
  console.log(`Testing correctness in ${testDir}...`);

  try {
    // 1. Test createFiles
    const files = [
      { path: 'a.txt', content: 'content a' },
      { path: 'sub/b.txt', content: 'content b' },
      { path: 'c.txt', content: 'search me' }
    ];
    const createResult = await createFiles(files, testDir);
    assert.strictEqual(createResult.success, true);
    assert.strictEqual(createResult.created.length, 3);
    assert.strictEqual(readFileSync(join(testDir, 'a.txt'), 'utf8'), 'content a');
    assert.strictEqual(readFileSync(join(testDir, 'sub/b.txt'), 'utf8'), 'content b');
    console.log('✓ createFiles is correct');

    // 2. Test searchInFiles
    const searchResult = await searchInFiles('search', ['c.txt', 'a.txt'], testDir);
    assert.strictEqual(searchResult.length, 1);
    assert.strictEqual(searchResult[0].path, 'c.txt');
    assert.strictEqual(searchResult[0].matches, 1);
    console.log('✓ searchInFiles is correct');

    // 3. Test findAndReplace
    const replaceResult = await findAndReplace('content', 'new', ['a.txt', 'sub/b.txt'], testDir);
    assert.strictEqual(replaceResult.success, true);
    assert.strictEqual(replaceResult.edited.length, 2);
    assert.strictEqual(readFileSync(join(testDir, 'a.txt'), 'utf8'), 'new a');
    console.log('✓ findAndReplace is correct');

    // 4. Test updateFiles
    const updateResult = await updateFiles([{ path: 'a.txt', content: 'updated a' }], testDir);
    assert.strictEqual(updateResult.success, true);
    assert.strictEqual(readFileSync(join(testDir, 'a.txt'), 'utf8'), 'updated a');
    console.log('✓ updateFiles is correct');

    // 5. Test createBackup
    const backupDir = await createBackup(['a.txt', 'sub/b.txt'], testDir);
    assert.ok(existsSync(backupDir));
    assert.strictEqual(readFileSync(join(backupDir, 'a.txt'), 'utf8'), 'updated a');
    assert.strictEqual(readFileSync(join(backupDir, 'sub/b.txt'), 'utf8'), 'new b');
    console.log('✓ createBackup is correct');

    // 6. Test deleteFiles
    const deleteResult = await deleteFiles(['a.txt', 'sub'], testDir);
    assert.strictEqual(deleteResult.success, true);
    assert.ok(!existsSync(join(testDir, 'a.txt')));
    assert.ok(!existsSync(join(testDir, 'sub')));
    console.log('✓ deleteFiles is correct');

    console.log('\nAll correctness tests passed!');

    // Cleanup
    rmSync(testDir, { recursive: true, force: true });
    rmSync(backupDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testCorrectness();
