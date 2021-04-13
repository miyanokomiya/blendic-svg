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
import { IdMap } from '/@/models'

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
  name = 'Replace'
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
  }
}

export function hasSameSeriesKey<T extends { seriesKey?: string }>(
  a: T,
  b: T
): boolean {
  return a.seriesKey !== undefined && a.seriesKey === b.seriesKey
}
