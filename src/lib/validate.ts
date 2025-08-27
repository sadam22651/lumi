export function isNonEmptyString(v: unknown, min = 1): v is string {
  return typeof v === 'string' && v.trim().length >= min
}
