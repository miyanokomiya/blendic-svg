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

import { ref } from 'vue'
import * as okahistory from 'okahistory'

export function useHistoryStore(getHistoryMax: () => number = () => 64) {
  const historyModule = okahistory.useHistory({
    max: getHistoryMax(),
    onUpdated,
  })

  const currentItemIndex = ref(-1)
  const historySummaries = ref<
    ReturnType<typeof historyModule.getActionSummaries>
  >([])

  function onUpdated() {
    currentItemIndex.value = historyModule.getCurrentIndex()
    historySummaries.value = historyModule.getActionSummaries()
  }

  return {
    historySummaries: historySummaries.value as Readonly<
      typeof historySummaries.value
    >,
    clear: historyModule.clear,
    dispatch: historyModule.dispatch,
    undo: historyModule.undo,
    redo: historyModule.redo,
    defineReducers: historyModule.defineReducers,
  } as any
}

// export type HistoryStore = ReturnType<typeof useHistoryStore>
export type HistoryStore = any
export type HistoryItem = any
