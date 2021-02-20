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

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
}

export interface KeyframeEditMode extends CanvasEditModeBase {}

export function useKeyframeEditMode(): KeyframeEditMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
  })

  const animationStore = useAnimationStore()
  const isAnySelected = computed(
    () =>
      Object.keys(animationStore.visibledSelectedKeyframeMap.value).length > 0
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

    const translate = sub(state.editMovement.current, state.editMovement.start)
    return Object.keys(animationStore.selectedBorns.value).reduce<
      IdMap<Transform>
    >((map, id) => {
      if (!animationStore.selectedBorns.value[id].connected) {
        map[id] = getTransform({
          translate,
        })
      }
      return map
    }, {})
  })

  function completeEdit() {
    if (!isAnySelected.value) return

    // animationStore.applyEditedTransforms(editTransforms.value)
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

  return {
    command: computed(() => state.command),
    getEditTransforms(id: string) {
      return editTransforms.value[id] ?? getTransform()
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
    execDelete,
    execAdd: () => {},
  }
}
