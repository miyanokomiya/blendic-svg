const suffixReg = /\.[0-9]{3,}$/

function increaseSuffix(src: string): string {
  if (!suffixReg.test(src)) return `${src}.001`

  return src.replace(suffixReg, (suffix) => {
    return '.' + `${parseInt(suffix.slice(1), 10) + 1}`.padStart(3, '0')
  })
}

export function getNextName(src: string, names: string[]): string {
  const nameMap = new Map(names.map((n) => [n, true]))
  let result = increaseSuffix(src)
  while (nameMap.has(result)) {
    result = increaseSuffix(result)
  }
  return result
}
