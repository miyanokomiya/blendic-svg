import { reactive, computed } from 'vue'
import { sub } from 'okageo'
import {
  Transform,
  getTransform,
  EditMode,
  IdMap,
  EditMovement,
  CanvasEditModeBase,
} from '../models/index'
import { useAnimationStore } from '../store/animation'
import { mapReduce } from '../utils/commons'
import { getFrameX, getNearestFrameAtPoint } from '../utils/animations'
import { applyTransform } from '../utils/armatures'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
}

export interface KeyframeEditMode extends CanvasEditModeBase {
  getEditFrames: (id: string) => number
}

export function useKeyframeEditMode(): KeyframeEditMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
  })

  const animationStore = useAnimationStore()

  const allKeyframes = computed(() => animationStore.visibledKeyframeMap.value)
  const editTargets = computed(
    () => animationStore.visibledSelectedKeyframeMap.value
  )
  const isAnySelected = computed(
    () => Object.keys(editTargets.value).length > 0
  )

  function cancel() {
    state.command = ''
    state.editMovement = undefined
  }

  function clickAny() {
    if (state.command) {
      completeEdit()
    }
  }

  function clickEmpty() {
    if (state.command) {
      completeEdit()
    } else {
      animationStore.selectKeyframe('')
    }
  }

  function setEditMode(mode: EditMode) {
    if (!isAnySelected.value) return

    cancel()
    state.command = mode
  }

  const editTransforms = computed(() => {
    if (!state.editMovement) return {}

    const translate = {
      x: state.editMovement.current.x - state.editMovement.start.x,
      y: 0,
    }
    return Object.keys(editTargets.value).reduce<IdMap<Transform>>(
      (map, id) => {
        map[id] = getTransform({ translate })
        return map
      },
      {}
    )
  })

  const editFrames = computed(() => {
    return mapReduce(editTransforms.value, (transform, id) => {
      const keyframe = allKeyframes.value[id]
      const nextX = applyTransform(
        { x: getFrameX(keyframe.frame), y: 0 },
        transform
      ).x
      return getNearestFrameAtPoint(nextX)
    })
  })

  function completeEdit() {
    if (!isAnySelected.value) return

    animationStore.execUpdateKeyFrames(
      mapReduce(editTargets.value, (keyframe, id) => ({
        ...keyframe,
        frame: getEditFrames(id),
      }))
    )
    state.editMovement = undefined
    state.command = ''
  }

  function select(id: string) {
    if (state.command) {
      completeEdit()
      return
    }
    animationStore.selectKeyframe(id)
  }

  function shiftSelect(id: string) {
    if (state.command) {
      completeEdit()
      return
    }
    animationStore.shiftSelectKeyframe(id)
  }

  function selectAll() {
    if (state.command) {
      completeEdit()
      return
    }
    animationStore.selectAllKeyframes()
  }

  function mousemove(arg: EditMovement) {
    if (state.command) {
      state.editMovement = arg
    }
  }

  function execDelete() {}

  function getEditFrames(id: string) {
    return editFrames.value[id] ?? allKeyframes.value[id].frame
  }

  return {
    command: computed(() => state.command),
    getEditTransforms(id: string) {
      return editTransforms.value[id] ?? getTransform()
    },
    getEditFrames,
    end: () => cancel(),
    cancel,
    setEditMode,
    select,
    shiftSelect,
    selectAll,
    mousemove,
    clickAny,
    clickEmpty,
    execDelete,
    execAdd: () => {},
  }
}
