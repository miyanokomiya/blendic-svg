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
