
import { createFiles, createBackup, deleteFiles, searchInFiles, findAndReplace } from '../dist/tools/multi-file.js';
import { join, relative } from 'path';
import { tmpdir } from 'os';
import { mkdtempSync, rmSync } from 'fs';

async function runBenchmark() {
  const testDir = mkdtempSync(join(tmpdir(), 'echo-benchmark-'));
  const fileCount = 100;
  const files = Array.from({ length: fileCount }, (_, i) => ({
    path: `file-${i}.txt`,
    content: `This is file number ${i} with some content for benchmarking. SEARCH_TERM`
  }));

  console.log(`Starting benchmark with ${fileCount} files in ${testDir}...`);

  // Benchmark createFiles
  let start = Date.now();
  await createFiles(files, testDir);
  let createTime = Date.now() - start;
  console.log(`createFiles took: ${createTime}ms`);

  const paths = files.map(f => f.path);

  // Benchmark searchInFiles
  start = Date.now();
  await searchInFiles('SEARCH_TERM', paths, testDir);
  let searchTime = Date.now() - start;
  console.log(`searchInFiles took: ${searchTime}ms`);

  // Benchmark findAndReplace
  start = Date.now();
  await findAndReplace('SEARCH_TERM', 'REPLACED_TERM', paths, testDir);
  let replaceTime = Date.now() - start;
  console.log(`findAndReplace took: ${replaceTime}ms`);

  // Benchmark createBackup
  start = Date.now();
  const backupDir = await createBackup(paths, testDir);
  let backupTime = Date.now() - start;
  console.log(`createBackup took: ${backupTime}ms`);

  // Benchmark deleteFiles
  start = Date.now();
  await deleteFiles(paths, testDir);
  let deleteTime = Date.now() - start;
  console.log(`deleteFiles took: ${deleteTime}ms`);

  // Cleanup
  try {
    rmSync(testDir, { recursive: true, force: true });
    rmSync(backupDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('\nSummary:');
  console.log(`createFiles: ${createTime}ms`);
  console.log(`searchInFiles: ${searchTime}ms`);
  console.log(`findAndReplace: ${replaceTime}ms`);
  console.log(`createBackup: ${backupTime}ms`);
  console.log(`deleteFiles: ${deleteTime}ms`);
  console.log(`Total Latency: ${createTime + searchTime + replaceTime + backupTime + deleteTime}ms`);
}

runBenchmark().catch(console.error);
