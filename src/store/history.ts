import { reactive, computed } from 'vue'

export interface HistoryItem {
  name: string
  undo: () => void
  redo: () => void
}

const state = reactive({
  undoStack: [] as HistoryItem[],
  redoStack: [] as HistoryItem[],
})

const allStack = computed(() => {
  return state.undoStack.concat(state.redoStack.concat().reverse())
})
const currentItemIndex = computed(() => state.undoStack.length)

function clearHistory() {
  state.undoStack = []
  state.redoStack = []
}
function push(item: HistoryItem) {
  state.undoStack.push(item)
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
  return { state, allStack, currentItemIndex, clearHistory, push, undo, redo }
}
