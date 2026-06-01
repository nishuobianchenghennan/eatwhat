export function pickRandomItem<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('候选列表不能为空')
  }

  const randomIndex = Math.floor(Math.random() * items.length)
  return items[randomIndex]
}

export function normalizeKeyword(value: string) {
  return value.trim().toLowerCase()
}

export function nowText() {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date())
}
