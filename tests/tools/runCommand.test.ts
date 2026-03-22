import { runCommand } from '../../src/tools/runCommand';

describe('runCommand', () => {
  it('should execute a simple command successfully', async () => {
    const result = await runCommand('echo', ['hello']);
    expect(result.success).toBe(true);
    expect(result.stdout.trim()).toBe('hello');
  });

  it('should handle command failure gracefully', async () => {
    const result = await runCommand('false', []);
    expect(result.success).toBe(false);
    expect(result.code).not.toBe(0);
  });

  it('should capture stderr on failure', async () => {
    const result = await runCommand('sh', ['-c', 'echo "error" >&1; exit 1']);
    expect(result.success).toBe(false);
  });
});
