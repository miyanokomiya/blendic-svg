import { reactive, computed } from 'vue'
import { getRadian, IVec2, rotate, sub } from 'okageo'
import {
  Transform,
  getTransform,
  BornSelectedState,
  EditMode,
  IdMap,
  EditMovement,
  CanvasEditModeBase,
} from '../models/index'
import { useStore } from '/@/store/index'
import { CanvasStore } from '/@/store/canvas'
import { useAnimationStore } from '../store/animation'
import { mapReduce } from '../utils/commons'
import { useElementStore } from '../store/element'

interface State {}

export interface WeightPaintMode extends CanvasEditModeBase {}

export function useWeightPaintMode(): WeightPaintMode {
  const store = useStore()
  const elementStore = useElementStore()

  function cancel() {}

  function clickAny() {}

  function clickEmpty() {
    elementStore.selectElement()
  }

  function setEditMode(_mode: EditMode) {}

  function completeEdit() {}

  function select(id: string) {
    completeEdit()
  }

  function shiftSelect(id: string) {
    completeEdit()
  }

  function selectAll() {
    completeEdit()
  }

  function mousemove(_arg: EditMovement) {}

  function clip() {}

  function paste() {}

  const availableCommandList = computed(() => {
    return [{ command: 'a', title: 'All Select' }]
  })

  return {
    command: computed(() => ''),
    getEditTransforms(_id: string) {
      return getTransform()
    },
    end: () => cancel(),
    cancel,
    setEditMode,
    select,
    shiftSelect,
    selectAll,
    mousemove,
    clickAny,
    clickEmpty,
    execDelete: () => {},
    execAdd: () => {},
    clip,
    paste,
    duplicate: () => {},
    availableCommandList,
  }
}
