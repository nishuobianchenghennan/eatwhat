export function pickRandomItem<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('候选列表不能为空')
  }

  const maxValue = 0x100000000
  const limit = Math.floor(maxValue / items.length) * items.length
  const array = new Uint32Array(1)

  while (true) {
    crypto.getRandomValues(array)
    if (array[0] < limit) {
      return items[array[0] % items.length]
    }
  }
}
