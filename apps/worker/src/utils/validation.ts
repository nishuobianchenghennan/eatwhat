const SAFE_TEXT_PATTERN = /^[\p{L}\p{N}\s\-_，。,.()（）!！?？&·]+$/u

export function nowIso() {
  return new Date().toISOString()
}

export function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function assertSafeText(value: string, fieldName: string, maxLength = 50) {
  if (!value) {
    throw new Error(`${fieldName}不能为空`)
  }

  if (value.length > maxLength) {
    throw new Error(`${fieldName}不能超过${maxLength}个字符`)
  }

  if (!SAFE_TEXT_PATTERN.test(value)) {
    throw new Error(`${fieldName}包含非法字符`)
  }
}

export function getSearchParam(url: URL, key: string) {
  return url.searchParams.get(key)?.trim() ?? ''
}
