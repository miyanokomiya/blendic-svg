import { reactive, computed } from 'vue'
import {
  Transform,
  BornSelectedState,
  EditMode,
  IdMap,
  CanvasEditModeBase,
  EditMovement,
} from '../models/index'
import { useStore } from '/@/store/index'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
}

export interface ObjectMode extends CanvasEditModeBase {
  getEditTransforms: (id: string) => Transform[]
}

export function useObjectMode(): ObjectMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
  })

  const store = useStore()
  const target = computed(() => store.lastSelectedArmature.value)

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
      store.selectArmature()
    }
  }

  function setEditMode(mode: EditMode) {
    if (!target.value) return

    cancel()
    state.command = mode
  }

  const editTransforms = computed(
    (): IdMap<Transform[]> => {
      return {}
    }
  )

  function completeEdit() {
    if (!target.value) return

    state.editMovement = undefined
    state.command = ''
  }

  function select(id: string, selectedState: BornSelectedState) {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectBorn(id, selectedState)
  }

  function shiftSelect(id: string, selectedState: BornSelectedState) {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectBorn(id, selectedState, true)
  }

  function mousemove(arg: EditMovement) {
    if (state.command) {
      state.editMovement = arg
    }
  }

  function execDelete() {
    if (state.command === '') {
      store.deleteArmature()
    }
  }

  function execAdd() {
    if (state.command === '') {
      store.addArmature()
    }
  }

  return {
    command: computed(() => state.command),
    getEditTransforms(id: string) {
      return editTransforms.value[id] || []
    },
    end: () => cancel(),
    cancel,
    setEditMode,
    select,
    shiftSelect,
    mousemove,
    clickAny,
    clickEmpty,
    execDelete,
    execAdd,
  }
}
