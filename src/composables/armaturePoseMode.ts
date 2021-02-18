import { reactive, computed } from 'vue'
import { getDistance, getRadian, multi, sub } from 'okageo'
import {
  Transform,
  Born,
  getTransform,
  BornSelectedState,
  EditMode,
  IdMap,
  EditMovement,
  CanvasEditModeBase,
} from '../models/index'
import { useStore } from '/@/store/index'
import { CanvasStore } from '/@/store/canvas'
import { useAnimationStore } from '../store/Animation'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
}

export interface BornPoseMode extends CanvasEditModeBase {}

export function useBornPoseMode(canvasStore: CanvasStore): BornPoseMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
  })

  const store = useStore()
  const animationStore = useAnimationStore()
  const lastSelectedBornId = computed(() => store.lastSelectedBorn.value?.id)

  const target = computed(() => store.lastSelectedArmature.value)
  const isAnySelected = computed(() => !!lastSelectedBornId.value)

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
      store.selectBorn()
    }
  }

  function setEditMode(mode: EditMode) {
    if (!target.value) return

    cancel()

    if (isAnySelected.value) {
      state.command = mode
    }
  }

  const editTransforms = computed(() => {
    if (!state.editMovement) return {}

    if (state.command === 'rotate') {
      const origin = animationStore.selectedPosedBornOrigin.value
      const rotate =
        ((getRadian(state.editMovement.current, origin) -
          getRadian(state.editMovement.start, origin)) /
          Math.PI) *
        180
      return Object.keys(animationStore.selectedBorns.value).reduce<
        IdMap<Transform>
      >((map, id) => {
        map[id] = getTransform({
          rotate,
        })
        return map
      }, {})
    }

    const translate = sub(state.editMovement.current, state.editMovement.start)
    const snappedTranslate = canvasStore.snapTranslate(translate)
    return Object.keys(animationStore.selectedBorns.value).reduce<
      IdMap<Transform>
    >((map, id) => {
      if (!animationStore.selectedBorns.value[id].connected) {
        map[id] = getTransform({ translate: snappedTranslate })
      }
      return map
    }, {})
  })

  function completeEdit() {
    if (!target.value) return

    animationStore.applyEditedTransforms(editTransforms.value)
    state.editMovement = undefined
    state.command = ''
  }

  function select(id: string, selectedState: BornSelectedState) {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectBorn(id, selectedState, false, true)
  }

  function shiftSelect(id: string, selectedState: BornSelectedState) {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectBorn(id, selectedState, true, true)
  }

  function mousemove(arg: EditMovement) {
    if (state.command) {
      state.editMovement = arg
    }
  }

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
    mousemove,
    clickAny,
    clickEmpty,
    execDelete: () => {},
    execAdd: () => {},
  }
}
