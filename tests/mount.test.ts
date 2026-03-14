/**
 * Tests for Mount Command and Knowledge Sources
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigStore } from '../src/utils/config.js';
import { MountSource } from '../src/types/index.js';

describe('Mount Management', () => {
  let config: ConfigStore;

  beforeEach(() => {
    config = new ConfigStore();
    config.reset();
  });

  it('should add a mount source', () => {
    const mount: MountSource = {
      id: 'test-mount',
      name: 'Test Mount',
      type: 'local',
      path: '/path/to/test',
      enabled: true,
    };

    config.addMount(mount);
    const mounts = config.getMounts();
    expect(mounts).toHaveLength(1);
    expect(mounts[0].id).toBe('test-mount');
  });

  it('should prevent duplicate mounts', () => {
    const mount: MountSource = {
      id: 'dup-1',
      name: 'Dup',
      type: 'local',
      path: '/dup',
      enabled: true,
    };

    config.addMount(mount);
    expect(() => config.addMount(mount)).toThrow();
  });

  it('should remove a mount source', () => {
    config.addMount({
      id: 'to-remove',
      name: 'Remove me',
      type: 'local',
      path: '/remove',
      enabled: true,
    });

    config.removeMount('to-remove');
    expect(config.getMounts()).toHaveLength(0);
  });
});
