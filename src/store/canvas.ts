import { getInner, getRadian, IVec2, sub } from 'okageo'
import { reactive } from 'vue'
import { CanvasMode } from '/@/models'

export type AxisGrid = '' | 'x' | 'y'

const state = reactive({
  canvasMode: 'object' as CanvasMode,
  axisGrid: '' as AxisGrid,
})

function setCanvasMode(canvasMode: CanvasMode) {
  state.canvasMode = canvasMode
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

export function useCanvasStore() {
  return {
    state,
    setCanvasMode,
    setAxisGrid,
    switchAxisGrid,
    snapScale,
    snapTranslate,
    isOppositeSide,
  }
}
