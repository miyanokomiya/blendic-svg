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

import { computed, ComputedRef, onBeforeUpdate, Ref, ref, toRaw } from 'vue'

export function useKeysCache<T>(
  getKeyMap: () => { [key: string]: unknown },
  data: Ref<T> | ComputedRef<T>
) {
  const cache = ref<T>()
  const keyMap = computed(getKeyMap)

  function getKeys(): string {
    return Object.keys(keyMap.value).sort().join(',')
  }

  function updateCache() {
    cache.value = toRaw(data.value)
  }

  let ids = getKeys()
  updateCache()

  onBeforeUpdate(() => {
    // watch only keys
    const nextIds = getKeys()
    if (ids !== nextIds) {
      updateCache()
      ids = nextIds
    }
  })

  return {
    cache,
    updateCache,
  }
}

export function useCache<T>(resetValue: () => T) {
  let value: T
  let isDirty = true

  function getValue(): T {
    if (isDirty) {
      value = resetValue()
      isDirty = false
    }
    return value
  }

  function update() {
    isDirty = true
  }

  return {
    update,
    getValue,
  }
}

export function useMapCache<K, T>(
  createKye: (src: K) => any,
  createValue: (src: K) => T,
  maxHistory = 100
) {
  const map = new Map<K, T>()

  function getValue(src: K) {
    const key = createKye(src)
    const value = map.get(key) ?? createValue(src)
    map.delete(key)
    map.set(key, value)
    if (map.size > maxHistory) {
      map.delete(map.keys().next().value)
    }

    return value
  }

  function clear() {
    map.clear()
  }

  return { getValue, clear }
}

export function useJITMap<T, K>(
  src: { [key: string]: T },
  fn: (v: T) => K
): {
  getValue: (key: string) => K
  clear: () => void
} {
  let map: { [key: string]: K } = {}

  function getValue(key: string) {
    if (!(key in map)) {
      map[key] = fn(src[key])
    }
    return map[key]
  }

  function clear() {
    map = {}
  }

  return {
    getValue,
    clear,
  }
}
