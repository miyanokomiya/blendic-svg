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

import { useHistoryStore } from '../../src/store/history'

describe('store/history.ts', () => {
  const historyStore = useHistoryStore()
  beforeEach(() => {
    historyStore.clearHistory()
  })

  describe('push', () => {
    it('push undo stack & clear redo stack', () => {
      historyStore.state.redoStack = [
        {
          name: 'redo',
          undo: () => {},
          redo: () => {},
        },
      ]
      historyStore.push({
        name: 'undo',
        undo: () => {},
        redo: () => {},
      })
      expect(historyStore.state.undoStack.length).toBe(1)
      expect(historyStore.state.undoStack[0].name).toBe('undo')
      expect(historyStore.state.redoStack.length).toBe(0)
    })

    it('replace history and inherit undo if two items are same series', () => {
      const undoFirst = jest.fn()
      const redoSecond = jest.fn()
      historyStore.state.undoStack = [
        {
          name: '1st',
          undo: undoFirst,
          redo: () => {},
          seriesKey: 'series',
        },
      ]
      historyStore.push({
        name: '2nd',
        undo: () => {},
        redo: redoSecond,
        seriesKey: 'series',
      })
      expect(historyStore.state.undoStack.length).toBe(1)
      expect(historyStore.state.undoStack[0].undo).toBe(undoFirst)
      expect(historyStore.state.undoStack[0].redo).toBe(redoSecond)
    })
  })

  describe('undo', () => {
    it('pop undo & push redo', () => {
      const undo = jest.fn()
      const redo = jest.fn()
      historyStore.push({ name: 'a', undo, redo })
      historyStore.undo()
      expect(undo).toHaveReturnedTimes(1)
      expect(redo).toHaveReturnedTimes(0)
      expect(historyStore.state.undoStack.length).toBe(0)
      expect(historyStore.state.redoStack.length).toBe(1)
      expect(historyStore.state.redoStack[0].name).toBe('a')
    })
  })

  describe('redo', () => {
    it('pop redo & push undo', () => {
      const undo = jest.fn()
      const redo = jest.fn()
      historyStore.push({ name: 'a', undo, redo })
      historyStore.undo()
      historyStore.redo()
      expect(undo).toHaveReturnedTimes(1)
      expect(redo).toHaveReturnedTimes(1)
      expect(historyStore.state.undoStack.length).toBe(1)
      expect(historyStore.state.undoStack[0].name).toBe('a')
      expect(historyStore.state.redoStack.length).toBe(0)
    })
  })
})
