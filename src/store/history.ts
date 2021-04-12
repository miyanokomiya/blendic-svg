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

import { reactive, computed } from 'vue'
import { useSettings } from '../composables/settings'
import { hasSameSeriesKey } from '/@/utils/histories'

export interface HistoryItem {
  name: string
  undo: () => void
  redo: () => void
  seriesKey?: string
}

const { settings } = useSettings()

const state = reactive({
  undoStack: [] as HistoryItem[],
  redoStack: [] as HistoryItem[],
})

const allStack = computed(() => {
  return state.undoStack.concat(state.redoStack.concat().reverse())
})
const currentItemIndex = computed(() => state.undoStack.length - 1)

const currentItemName = computed((): string => {
  return allStack.value[currentItemIndex.value]?.name ?? ''
})

function clearHistory() {
  state.undoStack = []
  state.redoStack = []
}
function push(item?: HistoryItem, execRedo = false) {
  if (!item) return

  const last = state.undoStack[state.undoStack.length - 1]
  if (last && hasSameSeriesKey(last, item)) {
    // replace history and inherit undo if two items are same series
    // e.g. push 'a' to ['a'] => ['a']
    state.undoStack.pop()
    state.undoStack.push({ ...item, undo: last.undo })
  } else {
    // furthermore check last before item to avoid intercepting other operation
    // e.g. push 'a' to ['a', 'b'] => ['b', 'a']
    const lastBefore = state.undoStack[state.undoStack.length - 2]
    if (lastBefore && hasSameSeriesKey(lastBefore, item)) {
      state.undoStack.splice(state.undoStack.length - 2, 1)
      state.undoStack.push({ ...item, undo: lastBefore.undo })
    } else {
      state.undoStack.push(item)
    }
  }

  if (execRedo) {
    item.redo()
  }

  if (state.undoStack.length > settings.historyMax) {
    state.undoStack = state.undoStack.slice(
      state.undoStack.length - settings.historyMax
    )
  }
  state.redoStack = []
}
function undo() {
  const item = state.undoStack.pop()
  if (!item) return

  item.undo()
  state.redoStack.push(item)
}
function redo() {
  const item = state.redoStack.pop()
  if (!item) return

  item.redo()
  state.undoStack.push(item)
}

export function useHistoryStore() {
  return {
    state,
    allStack,
    currentItemIndex,
    currentItemName,
    clearHistory,
    push,
    undo,
    redo,
  }
}
