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

import { computed, ref } from 'vue'
import { hasSameSeriesKey } from '/@/utils/histories'

export interface HistoryItem {
  name: string
  undo: () => void
  redo: () => void
  seriesKey?: string
}

export function useHistoryStore(getHistoryMax: () => number = () => 64) {
  const undoStack = ref<HistoryItem[]>([])
  const redoStack = ref<HistoryItem[]>([])

  const allStack = computed(() => {
    return undoStack.value.concat(redoStack.value.concat().reverse())
  })
  const currentItemIndex = computed(() => undoStack.value.length - 1)
  const currentItemName = computed((): string => {
    return allStack.value[currentItemIndex.value]?.name ?? ''
  })

  function clearHistory() {
    undoStack.value = []
    redoStack.value = []
  }

  function push(item?: HistoryItem, execRedo = false) {
    if (!item) return

    const last = undoStack.value[undoStack.value.length - 1]
    if (last && hasSameSeriesKey(last, item)) {
      // replace history and inherit undo if two items are same series
      // e.g. push 'a' to ['a'] => ['a']
      undoStack.value.pop()
      undoStack.value.push({ ...item, undo: last.undo })
    } else {
      // furthermore check last before item to avoid intercepting other operation
      // e.g. push 'a' to ['a', 'b'] => ['b', 'a']
      const lastBefore = undoStack.value[undoStack.value.length - 2]
      if (lastBefore && hasSameSeriesKey(lastBefore, item)) {
        undoStack.value.splice(undoStack.value.length - 2, 1)
        undoStack.value.push({ ...item, undo: lastBefore.undo })
      } else {
        undoStack.value.push(item)
      }
    }

    if (execRedo) {
      item.redo()
    }

    if (undoStack.value.length > getHistoryMax()) {
      undoStack.value = undoStack.value.slice(
        undoStack.value.length - getHistoryMax()
      )
    }
    redoStack.value = []
  }

  function undo() {
    const item = undoStack.value.pop()
    if (!item) return

    item.undo()
    redoStack.value.push(item)
  }

  function redo() {
    const item = redoStack.value.pop()
    if (!item) return

    item.redo()
    undoStack.value.push(item)
  }

  return {
    undoStack: computed(() => undoStack.value),
    redoStack: computed(() => redoStack.value),
    allStack,
    currentItemIndex,
    currentItemName,
    clearHistory,
    push,
    undo,
    redo,
  }
}
