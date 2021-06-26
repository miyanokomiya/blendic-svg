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

import { HistoryItem } from '/@/composables/stores/history'
import { IdMap, toMap } from '/@/models'
import { dropMap, extractMap, toList } from '/@/utils/commons'

export function convolute(
  head: HistoryItem,
  body: (HistoryItem | undefined)[],
  name?: string
): HistoryItem {
  return {
    name: name ?? head.name,
    undo() {
      head.undo()
      body.forEach((item) => item?.undo())
    },
    redo() {
      head.redo()
      body.forEach((item) => item?.redo())
    },
    seriesKey: head.seriesKey,
  }
}

export function getReplaceItem<T>(
  state: IdMap<T>,
  next: IdMap<T>,
  setFn: (val: IdMap<T>) => void,
  name = 'Replace',
  seriesKey?: string
): HistoryItem {
  const current = { ...state }

  const redo = () => {
    setFn(next)
  }
  return {
    name,
    undo: () => {
      setFn({ ...current })
    },
    redo,
    seriesKey,
  }
}

export function hasSameSeriesKey<T extends { seriesKey?: string }>(
  a: T,
  b: T
): boolean {
  return a.seriesKey !== undefined && a.seriesKey === b.seriesKey
}

export interface ListItemAccessor<T> {
  get: () => T[]
  set: (val: T[]) => void
}

export interface SelectedItemAccessor {
  get: () => IdMap<boolean>
  set: (val: IdMap<boolean>) => void
}

export interface LastSelectedItemIdAccessor {
  get: () => string
  set: (val: string) => void
}

export function getAddItemHistory<T extends { id: string }>(
  nodeAccessor: ListItemAccessor<T>,
  val: T
): HistoryItem {
  return {
    name: 'Add Item',
    undo: () => {
      nodeAccessor.set(nodeAccessor.get().filter((n) => n.id !== val.id))
    },
    redo: () => {
      nodeAccessor.set([...nodeAccessor.get(), val])
    },
  }
}

export function getSelectItemHistory(
  selectedNodesAccessor: SelectedItemAccessor,
  lastSelectedNodeAccessor: LastSelectedItemIdAccessor,
  id: string,
  shift = false
): HistoryItem {
  const currentSelected = selectedNodesAccessor.get()
  const currentLast = lastSelectedNodeAccessor.get()

  return {
    name: 'Select Item',
    undo: () => {
      selectedNodesAccessor.set(currentSelected)
      lastSelectedNodeAccessor.set(currentLast)
    },
    redo: () => {
      if (shift) {
        const current = !!selectedNodesAccessor.get()[id]
        selectedNodesAccessor.set({
          ...dropMap(selectedNodesAccessor.get(), { [id]: true }),
          ...(current ? {} : { [id]: true }),
        })
        lastSelectedNodeAccessor.set(current ? '' : id)
      } else if (id) {
        selectedNodesAccessor.set({ [id]: true })
        lastSelectedNodeAccessor.set(id)
      } else {
        selectedNodesAccessor.set({})
        lastSelectedNodeAccessor.set('')
      }
    },
  }
}

export function getSelectItemsHistory(
  selectedNodesAccessor: SelectedItemAccessor,
  lastSelectedNodeAccessor: LastSelectedItemIdAccessor,
  ids: IdMap<boolean>,
  shift = false
): HistoryItem {
  const currentSelected = selectedNodesAccessor.get()
  const currentLast = lastSelectedNodeAccessor.get()

  return {
    name: 'Select Items',
    undo: () => {
      selectedNodesAccessor.set(currentSelected)
      lastSelectedNodeAccessor.set(currentLast)
    },
    redo: () => {
      if (shift) {
        selectedNodesAccessor.set({ ...selectedNodesAccessor.get(), ...ids })
        lastSelectedNodeAccessor.set(
          Object.keys(ids)[0] || lastSelectedNodeAccessor.get() || ''
        )
      } else {
        selectedNodesAccessor.set(ids)
        lastSelectedNodeAccessor.set(Object.keys(ids)[0])
      }
    },
  }
}

export function getDeleteItemHistory<T extends { id: string }>(
  nodeAccessor: ListItemAccessor<T>,
  targetIds: IdMap<unknown>
): HistoryItem {
  const deletedMap = extractMap(toMap(nodeAccessor.get()), targetIds)
  return {
    name: 'Delete Item',
    undo: () => {
      nodeAccessor.set(
        toList({
          ...toMap(nodeAccessor.get()),
          ...deletedMap,
        })
      )
    },
    redo: () => {
      nodeAccessor.set(toList(dropMap(toMap(nodeAccessor.get()), targetIds)))
    },
  }
}
