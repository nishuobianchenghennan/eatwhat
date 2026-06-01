export function createInClause(values: unknown[]) {
  return values.map(() => '?').join(', ')
}

export function toJsonArray(value: unknown) {
  return JSON.stringify(Array.isArray(value) ? value : [])
}
