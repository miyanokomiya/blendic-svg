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

import { useHistoryStore } from '/@/composables/stores/history'

describe('composables/stores/history.ts', () => {
  describe('push', () => {
    it('push undo stack & clear redo stack', () => {
      const historyStore = useHistoryStore()
      historyStore.push({ name: 'redo', undo: () => {}, redo: () => {} })
      expect(historyStore.undoStack.value.length).toBe(1)
      historyStore.undo()
      expect(historyStore.undoStack.value.length).toBe(0)
      expect(historyStore.redoStack.value.length).toBe(1)
      historyStore.push({ name: 'undo', undo: () => {}, redo: () => {} })
      expect(historyStore.undoStack.value.length).toBe(1)
      expect(historyStore.undoStack.value[0].name).toBe('undo')
      expect(historyStore.redoStack.value.length).toBe(0)
    })

    describe('seriesKey', () => {
      it('replace history and inherit undo if two items have same series key', () => {
        const historyStore = useHistoryStore()
        const undoFirst = jest.fn()
        const redoSecond = jest.fn()
        historyStore.push({
          name: '1st',
          undo: undoFirst,
          redo: () => {},
          seriesKey: 'series',
        })
        historyStore.push({
          name: '2nd',
          undo: () => {},
          redo: redoSecond,
          seriesKey: 'series',
        })
        expect(historyStore.undoStack.value.length).toBe(1)
        expect(historyStore.undoStack.value[0].undo).toBe(undoFirst)
        expect(historyStore.undoStack.value[0].redo).toBe(redoSecond)
      })

      it('remove history and inherit undo if new item and before last one have same series key', () => {
        const historyStore = useHistoryStore()
        const undoFirst = jest.fn()
        const redoThird = jest.fn()
        historyStore.push({
          name: '1st',
          undo: undoFirst,
          redo: () => {},
          seriesKey: 'series',
        })
        historyStore.push({
          name: '2nd',
          undo: () => {},
          redo: () => {},
          seriesKey: 'series_2nd',
        })
        historyStore.push({
          name: '3rd',
          undo: () => {},
          redo: redoThird,
          seriesKey: 'series',
        })
        expect(historyStore.undoStack.value.length).toBe(2)
        expect(historyStore.undoStack.value[1].undo).toBe(undoFirst)
        expect(historyStore.undoStack.value[1].redo).toBe(redoThird)
        expect(historyStore.undoStack.value[0].name).toBe('2nd')
      })
    })

    it('should exec redo if execRedo is true', () => {
      const historyStore = useHistoryStore()
      const redo = jest.fn()
      historyStore.push({
        name: '1',
        undo: () => {},
        redo,
      })
      expect(redo).toHaveBeenCalledTimes(0)
      historyStore.push(
        {
          name: '2',
          undo: () => {},
          redo,
        },
        true
      )
      expect(redo).toHaveBeenCalledTimes(1)
    })

    it('should ignore undefined item', () => {
      const historyStore = useHistoryStore()
      historyStore.push(undefined)
      expect(historyStore.undoStack.value).toHaveLength(0)
    })

    it('should limit max items count', () => {
      const historyStore = useHistoryStore(() => 1)
      historyStore.push({ name: '1', undo: () => {}, redo: () => {} })
      historyStore.push({ name: '2', undo: () => {}, redo: () => {} })
      expect(historyStore.undoStack.value).toHaveLength(1)
    })
  })

  describe('undo', () => {
    it('pop undo & push redo', () => {
      const historyStore = useHistoryStore()
      const undo = jest.fn()
      const redo = jest.fn()
      historyStore.push({ name: 'a', undo, redo })
      historyStore.undo()
      expect(undo).toHaveReturnedTimes(1)
      expect(redo).toHaveReturnedTimes(0)
      expect(historyStore.undoStack.value.length).toBe(0)
      expect(historyStore.redoStack.value.length).toBe(1)
      expect(historyStore.redoStack.value[0].name).toBe('a')
    })
  })

  describe('redo', () => {
    it('pop redo & push undo', () => {
      const historyStore = useHistoryStore()
      const undo = jest.fn()
      const redo = jest.fn()
      historyStore.push({ name: 'a', undo, redo })
      historyStore.undo()
      historyStore.redo()
      expect(undo).toHaveReturnedTimes(1)
      expect(redo).toHaveReturnedTimes(1)
      expect(historyStore.undoStack.value.length).toBe(1)
      expect(historyStore.undoStack.value[0].name).toBe('a')
      expect(historyStore.redoStack.value.length).toBe(0)
    })
  })
})
