import { isValidPackageName } from '../../src/utils/packageNameValidator';

describe('isValidPackageName', () => {
  it('should accept valid package names', () => {
    expect(isValidPackageName('lodash')).toBe(true);
    expect(isValidPackageName('@scope/package')).toBe(true);
    expect(isValidPackageName('my-package')).toBe(true);
    expect(isValidPackageName('my_package')).toBe(true);
    expect(isValidPackageName('package123')).toBe(true);
  });

  it('should reject invalid package names', () => {
    expect(isValidPackageName('$(whoami)')).toBe(false);
    expect(isValidPackageName('package; rm -rf /')).toBe(false);
    expect(isValidPackageName('package`id`')).toBe(false);
    expect(isValidPackageName('package$(cmd)')).toBe(false);
  });
});
