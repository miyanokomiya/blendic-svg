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

import { computed, Ref, ref } from 'vue'
import * as okahistory from 'okahistory'

export function useValueStore<T>(
  name: string,
  getDefaultState: () => T,
  isSameState: (a: T, b: T) => boolean = (a, b) => a === b
) {
  const state = ref<T>(getDefaultState()) as Ref<T>

  function restore(val: T) {
    state.value = val
  }

  function createSnapshot(): T {
    return state.value
  }

  const actionNames = {
    update: `${name}_UPDATE`,
  }

  const updateReducer: okahistory.Reducer<T, T> = {
    getLabel: () => `Update ${name}`,
    redo(val) {
      const snapshot = state.value
      state.value = val
      return snapshot
    },
    undo(snapshot) {
      state.value = snapshot
    },
  }

  function createUpdateAction(
    val: T,
    seriesKey?: string
  ): okahistory.Action<T> | undefined {
    if (isSameState(state.value, val)) return
    return { name: actionNames.update, args: val, seriesKey }
  }

  return {
    state: computed(() => state.value),
    restore,
    createSnapshot,
    reducers: {
      [actionNames.update]: updateReducer,
    },
    createUpdateAction,
  }
}
