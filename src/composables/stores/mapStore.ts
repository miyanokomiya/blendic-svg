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
import * as okahistory from 'okahistory'
import { IdMap } from '/@/models'
import { dropMap, extractMap, reduceToMap } from '/@/utils/commons'

export function useMapStore<T>(name: string) {
  const state: Ref<IdMap<T>> = ref({})

  function init(val: IdMap<T> = {}) {
    state.value = val
  }

  const actionNames = {
    upsert: `${name}_UPSERT`,
    set: `${name}_SET`,
  }

  const upsertReducer: okahistory.Reducer<
    IdMap<T>,
    { created: string[]; updated: IdMap<T> }
  > = {
    getLabel: () => `Upsert ${name}`,
    redo(val) {
      const created = Object.keys(dropMap(val, state.value))
      const updated = extractMap(state.value, val)
      state.value = { ...state.value, ...val }
      return { created, updated }
    },
    undo(snapshot) {
      state.value = dropMap(
        { ...state.value, ...snapshot.updated },
        reduceToMap(snapshot.created, () => true)
      )
    },
  }

  function createUpsertAction(
    val: IdMap<T>,
    seriesKey?: string
  ): okahistory.Action<IdMap<T>> | undefined {
    return { name: actionNames.upsert, args: val, seriesKey }
  }

  const setReducer: okahistory.Reducer<IdMap<T>, IdMap<T>> = {
    getLabel: () => `Set ${name}`,
    redo(val) {
      const snapshot = state.value
      state.value = val
      return snapshot
    },
    undo(snapshot) {
      state.value = snapshot
    },
  }

  function createSetAction(
    val: IdMap<T>,
    seriesKey?: string
  ): okahistory.Action<IdMap<T>> | undefined {
    return { name: actionNames.set, args: val, seriesKey }
  }

  return {
    state: computed(() => state.value),
    init,
    reducers: {
      [actionNames.upsert]: upsertReducer,
      [actionNames.set]: setReducer,
    },
    createUpsertAction,
    createSetAction,
  }
}
