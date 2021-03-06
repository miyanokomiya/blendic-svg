/*
This file is part of Blendic SVG.

Blendic SVG is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Blendic SVG is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Blendic SVG.  If not, see <https://www.gnu.org/licenses/>.

Copyright (C) 2021, Tomoya Komiyama.
*/

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
