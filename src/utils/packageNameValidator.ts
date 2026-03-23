/**
 * Conservative package-name validator for dynamic npm installs.
 * Allows scoped packages like @scope/name and common safe characters.
 * Spaces are explicitly excluded as they are not valid in npm package names
 * and could be used to inject shell arguments.
 */
export function isValidPackageName(name: string): boolean {
  return /^(@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(name);
}
