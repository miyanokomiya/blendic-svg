import { reactive, computed, ComputedRef } from 'vue'
import {
  Transform,
  getTransform,
  EditMode,
  IdMap,
  EditMovement,
  CanvasEditModeBase,
  Keyframe,
  getKeyframe,
  toMap,
} from '../models/index'
import { useAnimationStore } from '../store/animation'
import { mapReduce, toList } from '../utils/commons'
import { getFrameX, getNearestFrameAtPoint } from '../utils/animations'
import { applyTransform } from '../utils/armatures'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
  clipboard: Keyframe[]
  tmpKeyframes: IdMap<Keyframe>
}

export interface KeyframeEditMode extends CanvasEditModeBase {
  tmpKeyframes: ComputedRef<IdMap<Keyframe>>
  getEditFrames: (id: string) => number
  selectFrame: (frame: number) => void
  shiftSelectFrame: (frame: number) => void
}

export function useKeyframeEditMode(): KeyframeEditMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
    clipboard: [],
    tmpKeyframes: {},
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
    state.tmpKeyframes = {}
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

    const updatedMap = mapReduce(editTargets.value, (keyframe, id) => ({
      ...keyframe,
      frame: getEditFrames(id),
    }))
    const duplicatedList = toList(state.tmpKeyframes)
    if (duplicatedList.length > 0) {
      animationStore.completeDuplicateKeyframes(
        toList(state.tmpKeyframes),
        toList(updatedMap)
      )
    } else {
      animationStore.execUpdateKeyframes(updatedMap)
    }

    state.tmpKeyframes = {}
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
    animationStore.selectKeyframe(id, true)
  }

  function selectFrame(frame: number) {
    if (state.command) {
      completeEdit()
      return
    }
    animationStore.selectKeyframeByFrame(frame)
  }

  function shiftSelectFrame(frame: number) {
    if (state.command) {
      completeEdit()
      return
    }
    animationStore.selectKeyframeByFrame(frame, true)
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

  function execDelete() {
    if (state.command) {
      completeEdit()
      return
    }
    animationStore.execDeleteKeyframes()
  }

  function getEditFrames(id: string): number {
    return (
      editFrames.value[id] ??
      allKeyframes.value[id]?.frame ??
      state.tmpKeyframes[id].frame
    )
  }

  function clip() {
    state.clipboard = toList(editTargets.value)
  }

  function paste() {
    if (state.clipboard.length === 0) return
    animationStore.pasteKeyframes(state.clipboard)
  }

  function duplicate() {
    if (state.command !== '') return

    // duplicate current edit targets as tmp keyframes
    // & continue to edit original edit targets
    const duplicated = toMap(
      toList(
        mapReduce(editTargets.value, (src) => {
          return getKeyframe({ ...src }, true)
        })
      )
    )
    state.tmpKeyframes = duplicated
    state.command = 'grab'
  }

  const availableCommandList = computed(() => {
    if (isAnySelected.value) {
      return [
        { command: 'g', title: 'Grab' },
        { command: 'a', title: 'All Select' },
        { command: 'x', title: 'Delete' },
        { command: 'D', title: 'Duplicate' },
        { command: 'Ctrl + c', title: 'Clip' },
        { command: 'Ctrl + v', title: 'Paste' },
        { command: 'Space', title: 'Play/Stop' },
      ]
    } else {
      return [
        { command: 'a', title: 'All Select' },
        { command: 'Ctrl + v', title: 'Paste' },
        { command: 'Space', title: 'Play/Stop' },
      ]
    }
  })

  return {
    tmpKeyframes: computed(() => state.tmpKeyframes),
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
    selectFrame,
    shiftSelectFrame,
    selectAll,
    mousemove,
    clickAny,
    clickEmpty,
    execDelete,
    execAdd: () => {},
    clip,
    paste,
    duplicate,
    availableCommandList,
  }
}
