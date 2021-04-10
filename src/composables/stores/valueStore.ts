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

import { computed, Ref, ref } from '@vue/runtime-core'
import { HistoryItem } from '/@/store/history'

export function useValueStore<T>(
  name: string,
  getDefaultState: () => T,
  isSameState: (a: T, b: T) => boolean = (a, b) => a === b
) {
  const state = ref<T>(getDefaultState()) as Ref<T>

  function _setState(val: T) {
    state.value = val
  }

  function setState(next: T, seriesKey?: string): HistoryItem | undefined {
    if (isSameState(state.value, next)) return

    return getUpdateStateItem(name, state.value, next, _setState, seriesKey)
  }

  return {
    state: computed(() => state.value),
    setState,
  }
}

function getUpdateStateItem<T>(
  name: string,
  current: T,
  next: T,
  setState: (val: T) => void,
  seriesKey?: string
): HistoryItem {
  return {
    name: `Update ${name}`,
    undo: () => {
      setState(current)
    },
    redo: () => {
      setState(next)
    },
    seriesKey,
  }
}
