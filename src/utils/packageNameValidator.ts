/**
 * Conservative package-name validator for dynamic npm installs.
 * Allows scoped packages like @scope/name and common safe characters.
 */
export function isValidPackageName(name: string): boolean {
  return /^[a-z0-9 @._\-/]+$/i.test(name);
}
