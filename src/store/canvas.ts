import { getInner, IVec2, sub } from 'okageo'
import { computed, reactive, watch } from 'vue'
import { BoneEditMode, useBoneEditMode } from '../composables/armatureEditMode'
import { BonePoseMode, useBonePoseMode } from '../composables/armaturePoseMode'
import { ObjectMode, useObjectMode } from '../composables/objectMode'
import { useWeightPaintMode } from '../composables/weightPaintMode'
import { HistoryItem, useHistoryStore } from './history'
import { BoneSelectedState, CanvasMode, EditMode, Transform } from '/@/models'

export type AxisGrid = '' | 'x' | 'y'

const historyStore = useHistoryStore()
const state = reactive({
  canvasMode: 'object' as CanvasMode,
  pastCanvasMode: 'edit' as CanvasMode,
  axisGrid: '' as AxisGrid,
})

function initState() {
  state.canvasMode = 'object'
  state.pastCanvasMode = 'edit'
  state.axisGrid = ''
}

const canvasEditMode = computed(():
  | BoneEditMode
  | ObjectMode
  | BonePoseMode => {
  if (state.canvasMode === 'edit') {
    return useBoneEditMode(useCanvasStore())
  } else if (state.canvasMode === 'pose') {
    return useBonePoseMode(useCanvasStore())
  } else if (state.canvasMode === 'weight') {
    return useWeightPaintMode()
  } else {
    return useObjectMode()
  }
})
watch(canvasEditMode, (_to, from) => {
  if (from) from.end()
})

const command = computed((): EditMode => canvasEditMode.value.command.value)

const availableCommandList = computed(
  () => canvasEditMode.value.availableCommandList.value
)

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

function getEditTransforms(id: string): Transform {
  return canvasEditMode.value.getEditTransforms(id)
}

export function useCanvasStore() {
  return {
    initState,
    state,
    command,
    toggleCanvasMode,
    ctrlToggleCanvasMode,
    setCanvasMode,
    setAxisGrid,
    switchAxisGrid,
    snapScale,
    snapTranslate,
    isOppositeSide,
    getEditTransforms,
    mousemove: (arg: { current: IVec2; start: IVec2 }) =>
      canvasEditMode.value.mousemove(arg),
    clickAny: () => canvasEditMode.value.clickAny(),
    clickEmpty: () => canvasEditMode.value.clickEmpty(),
    cancel: () => canvasEditMode.value.cancel(),
    setEditMode: (mode: EditMode) => canvasEditMode.value.setEditMode(mode),
    execDelete: () => canvasEditMode.value.execDelete(),
    execAdd: () => canvasEditMode.value.execAdd(),
    select: (id: string, selectedState: BoneSelectedState) =>
      canvasEditMode.value.select(id, selectedState),
    shiftSelect: (id: string, selectedState: BoneSelectedState) =>
      canvasEditMode.value.shiftSelect(id, selectedState),
    selectAll: () => canvasEditMode.value.selectAll(),
    clip: () => canvasEditMode.value.clip(),
    paste: () => canvasEditMode.value.paste(),
    duplicate: () => canvasEditMode.value.duplicate(),
    availableCommandList,
  }
}
export type CanvasStore = ReturnType<typeof useCanvasStore>

function getChangeCanvasModeItem(canvasMode: CanvasMode): HistoryItem {
  const currentMode = state.canvasMode
  const currentPastMode = state.pastCanvasMode
  const redo = () => {
    state.pastCanvasMode = state.canvasMode
    state.canvasMode = canvasMode
  }
  return {
    name: 'Change Mode',
    undo: () => {
      state.canvasMode = currentMode
      state.pastCanvasMode = currentPastMode
    },
    redo,
  }
}
