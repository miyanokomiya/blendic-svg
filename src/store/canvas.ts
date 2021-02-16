import { getInner, IVec2, sub } from 'okageo'
import { computed, reactive, ref } from 'vue'
import { BornEditMode, useBornEditMode } from '../composables/armatureEditMode'
import { BornPoseMode, useBornPoseMode } from '../composables/armaturePoseMode'
import { HistoryItem, useHistoryStore } from './history'
import { CanvasMode, EditMode, Transform } from '/@/models'

export type AxisGrid = '' | 'x' | 'y'

const historyStore = useHistoryStore()

const state = reactive({
  canvasMode: 'object' as CanvasMode,
  pastCanvasMode: 'edit' as CanvasMode,
  axisGrid: '' as AxisGrid,
})

const canvasEditMode = ref<BornEditMode | BornPoseMode>()

const editMode = computed(
  (): EditMode => {
    return canvasEditMode.value?.state.editMode ?? ''
  }
)

function initEditMode() {
  if (canvasEditMode.value) canvasEditMode.value?.end()

  if (state.canvasMode === 'edit') {
    canvasEditMode.value = useBornEditMode()
  } else if (state.canvasMode === 'pose') {
    canvasEditMode.value = useBornPoseMode()
  } else {
    canvasEditMode.value = undefined
  }
}

function toggleCanvasMode() {
  if (state.canvasMode === 'edit') {
    setCanvasMode(state.pastCanvasMode)
  } else {
    setCanvasMode('edit')
  }
}
function ctrlToggleCanvasMode() {
  if (state.canvasMode === 'edit') {
    if (state.pastCanvasMode === 'object') {
      setCanvasMode('pose')
    } else {
      setCanvasMode('object')
    }
  } else if (state.canvasMode === 'object') {
    setCanvasMode('pose')
  } else {
    setCanvasMode('object')
  }
}
function setCanvasMode(canvasMode: CanvasMode) {
  const item = getChangeCanvasModeItem(canvasMode)
  historyStore.push(item)
  item.redo()
}
function setAxisGrid(val: AxisGrid) {
  state.axisGrid = val
}
function switchAxisGrid(val: AxisGrid) {
  state.axisGrid = state.axisGrid === val ? '' : val
}
function snapScale(scale: IVec2): IVec2 {
  return {
    x: state.axisGrid === 'y' ? 1 : scale.x,
    y: state.axisGrid === 'x' ? 1 : scale.y,
  }
}
function snapTranslate(translate: IVec2): IVec2 {
  return {
    x: state.axisGrid === 'y' ? 0 : translate.x,
    y: state.axisGrid === 'x' ? 0 : translate.y,
  }
}
function isOppositeSide(origin: IVec2, from: IVec2, current: IVec2): boolean {
  return getInner(sub(from, origin), sub(current, origin)) < 0
}

function getEditTransforms(id: string): Transform[] {
  return canvasEditMode.value?.getEditTransforms(id) ?? []
}

export function useCanvasStore() {
  return {
    state,
    canvasEditMode,
    editMode,
    toggleCanvasMode,
    ctrlToggleCanvasMode,
    setCanvasMode,
    setAxisGrid,
    switchAxisGrid,
    snapScale,
    snapTranslate,
    isOppositeSide,
    getEditTransforms,
  }
}

function getChangeCanvasModeItem(canvasMode: CanvasMode): HistoryItem {
  const currentMode = state.canvasMode
  const currentPastMode = state.pastCanvasMode
  const redo = () => {
    state.pastCanvasMode = state.canvasMode
    state.canvasMode = canvasMode
    initEditMode()
  }
  return {
    name: 'Change Mode',
    undo: () => {
      state.canvasMode = currentMode
      state.pastCanvasMode = currentPastMode
      initEditMode()
    },
    redo,
  }
}
