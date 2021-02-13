import { IVec2 } from 'okageo'
import { reactive } from 'vue'

export type AxisGrid = '' | 'x' | 'y'

const state = reactive({
  axisGrid: '' as AxisGrid,
})

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

export function useCanvasStore() {
  return { state, setAxisGrid, switchAxisGrid, snapScale, snapTranslate }
}
