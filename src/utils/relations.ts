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

export function getNotDuplicatedName(src: string, names: string[]): string {
  const nameMap = new Map(names.map((n) => [n, true]))
  if (!nameMap.has(src)) return src

  let result = increaseSuffix(src)
  while (nameMap.has(result)) {
    result = increaseSuffix(result)
  }
  return result
}

export function updateNameInList<T extends { name: string }>(
  src: T[],
  index: number,
  name: string
): T[] {
  const ret = src.concat()
  const target = ret[index]
  if (!target || target.name === name) return src

  ret[index] = {
    ...target,
    name: getNotDuplicatedName(
      name,
      ret.map((c) => c.name)
    ),
  }

  return ret
}

export function unshiftInList<T>(src: T[], index: number): T[] {
  if (index <= 0 || src.length - 1 < index) return src

  const ret = src.concat()
  const tmp = ret[index - 1]
  ret[index - 1] = ret[index]
  ret[index] = tmp
  return ret
}

export function shiftInList<T>(src: T[], index: number): T[] {
  if (index < 0 || src.length - 1 <= index) return src

  const ret = src.concat()
  const tmp = ret[index + 1]
  ret[index + 1] = ret[index]
  ret[index] = tmp
  return ret
}

export interface TreeNode {
  id: string
  name: string
  children: TreeNode[]
}

export interface DependencyMap {
  [id: string]: { [id: string]: true }
}

export function getAllDependencies(
  depSrc: DependencyMap,
  targetId: string
): { [id: string]: true } {
  const firstSrc = depSrc[targetId]
  if (!firstSrc) return {}

  const ret: { [id: string]: true } = {}
  const currentSrc = { ...depSrc }
  delete currentSrc[targetId]

  Object.keys(firstSrc).forEach((firstId) => {
    const deps = getAllDependencies(currentSrc, firstId)
    Object.keys(deps).forEach((id) => {
      ret[id] = true
      delete currentSrc[id]
    })
    ret[firstId] = true
    delete currentSrc[firstId]
  })

  delete ret[targetId]

  return ret
}
