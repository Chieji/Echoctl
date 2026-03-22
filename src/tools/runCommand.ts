import { execFile } from 'child_process';
import { promisify } from 'util';
import type { ExecFileOptions } from 'child_process';

const execFileAsync = promisify(execFile);

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr?: string;
  code?: number | null;
  error?: string;
}

export async function runCommand(
  cmd: string,
  args: string[] = [],
  options: ExecFileOptions = {}
): Promise<CommandResult> {
  try {
    const { stdout, stderr } = (await execFileAsync(cmd, args, {
      maxBuffer: 1024 * 1024,
      ...options,
    })) as { stdout: string; stderr: string };

    return { success: true, stdout: stdout ?? '', stderr: stderr ?? '', code: 0 };
  } catch (err: any) {
    return {
      success: false,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? (err.message || ''),
      code: typeof err.code === 'number' ? err.code : null,
      error: err.message,
    };
  }
}
