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

export function topSort(depSrc: DependencyMap, strict = false): string[] {
  const ret: string[] = []
  const unresolved = new Set(Object.keys(depSrc))
  const processed = new Set()

  const ctx = {
    resolve(id: string) {
      if (depSrc[id] && unresolved.has(id)) {
        ret.push(id)
      }
      unresolved.delete(id)
    },
    getDeps(id: string) {
      if (processed.has(id)) {
        if (strict) throw new Error('Circular dependency is detected.')
        return undefined
      }
      processed.add(id)
      return depSrc[id]
    },
  }

  while (unresolved.size > 0) {
    topSortStep(ctx, unresolved.values().next().value!)
  }

  return ret
}

function topSortStep(
  ctx: {
    resolve: (id: string) => void
    getDeps: (id: string) => { [id: string]: true } | undefined
  },
  target: string
) {
  const deps = ctx.getDeps(target)
  if (deps) {
    Object.keys(deps).forEach((child) => topSortStep(ctx, child))
  }
  ctx.resolve(target)
}

export function getDependencies(
  depSrc: DependencyMap,
  targetId: string,
  strict = false
): string[] {
  const ret: string[] = []
  const unresolved = new Set(Object.keys(depSrc))
  const processed = new Set()

  const ctx = {
    resolve(id: string) {
      if (depSrc[id] && unresolved.has(id) && id !== targetId) {
        ret.push(id)
      }
      unresolved.delete(id)
    },
    getDeps(id: string) {
      if (processed.has(id)) {
        if (strict) throw new Error('Circular dependency is detected.')
        return undefined
      }
      processed.add(id)
      return depSrc[id]
    },
  }

  topSortStep(ctx, targetId)
  return ret
}

export function findPath(
  depSrc: DependencyMap,
  from: string,
  to: string
): { path: string[]; processed: string[] } {
  if (!depSrc[from]) return { path: [], processed: [from] }
  if (depSrc[from][to]) return { path: [from, to], processed: [from, to] }

  let ret: string[] = []
  const processed = new Set([from])

  let queue = new Map<string, string[]>(
    Object.keys(depSrc[from]).map((id) => [id, [from]])
  )

  while (queue.size > 0) {
    const nextQueue = new Map<string, string[]>()

    for (const [current, path] of queue) {
      const currentDep = depSrc[current]
      if (!currentDep || processed.has(current)) continue

      processed.add(current)
      if (currentDep[to]) {
        ret = [...path, current, to]
        processed.add(to)
        nextQueue.clear()
        break
      } else {
        const newPath = [...path, current]
        Object.keys(currentDep).forEach((id) => queue.set(id, newPath))
      }
    }

    queue = nextQueue
  }

  return { path: ret, processed: Array.from(processed.values()) }
}

export function getAllDependentTo(depSrc: DependencyMap, to: string): string[] {
  const ret: string[] = []
  const queue = new Set(Object.keys(depSrc))
  const processed = new Set([to])
  const currentDepSrc = { ...depSrc }
  delete currentDepSrc[to]

  for (const id of queue) {
    if (processed.has(id)) continue

    const pathInfo = findPath(currentDepSrc, id, to)
    if (pathInfo.path.length > 0) {
      pathInfo.path.forEach((p, i) => {
        // Last item is "to"
        if (i === pathInfo.path.length - 1) return
        ret.push(p)
      })
    }
    pathInfo.processed.forEach((p) => {
      delete currentDepSrc[p]
      processed.add(p)
    })
  }

  return ret
}
