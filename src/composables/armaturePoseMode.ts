import { reactive, computed } from 'vue'
import { getRadian, IVec2, rotate, sub } from 'okageo'
import {
  Transform,
  getTransform,
  BoneSelectedState,
  EditMode,
  IdMap,
  EditMovement,
  CanvasEditModeBase,
} from '../models/index'
import { useStore } from '/@/store/index'
import { CanvasStore } from '/@/store/canvas'
import { useAnimationStore } from '../store/animation'
import { mapReduce } from '../utils/commons'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
  clipboard: IdMap<Transform>
}

export interface BonePoseMode extends CanvasEditModeBase {}

export function useBonePoseMode(canvasStore: CanvasStore): BonePoseMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
    clipboard: {},
  })

  const store = useStore()
  const animationStore = useAnimationStore()
  const lastSelectedBoneId = computed(() => store.lastSelectedBone.value?.id)

  const target = computed(() => store.lastSelectedArmature.value)
  const isAnySelected = computed(() => !!lastSelectedBoneId.value)

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
      store.selectBone()
    }
  }

  function setEditMode(mode: EditMode) {
    if (!target.value) return

    cancel()

    if (isAnySelected.value) {
      state.command = mode
    }
  }

  function convertToPosedSpace(vec: IVec2, boneId: string): IVec2 {
    const bone = animationStore.currentPosedBones.value[boneId]
    const parent = animationStore.currentPosedBones.value[bone.parentId]
    if (parent) {
      return rotate(vec, (-parent.transform.rotate / 180) * Math.PI)
    } else {
      return vec
    }
  }

  const editTransforms = computed(() => {
    if (!state.editMovement) return {}

    if (state.command === 'rotate') {
      const origin = animationStore.selectedPosedBoneOrigin.value
      const rotate =
        ((getRadian(state.editMovement.current, origin) -
          getRadian(state.editMovement.start, origin)) /
          Math.PI) *
        180
      return Object.keys(animationStore.selectedBones.value).reduce<
        IdMap<Transform>
      >((map, id) => {
        map[id] = getTransform({ rotate })
        return map
      }, {})
    }

    const translate = sub(state.editMovement.current, state.editMovement.start)
    const snappedTranslate = canvasStore.snapTranslate(translate)
    return Object.keys(animationStore.selectedBones.value).reduce<
      IdMap<Transform>
    >((map, id) => {
      if (!animationStore.selectedBones.value[id].connected) {
        map[id] = getTransform({
          translate: convertToPosedSpace(snappedTranslate, id),
        })
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

  function select(id: string, selectedState: BoneSelectedState) {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectBone(id, selectedState, false, true)
  }

  function shiftSelect(id: string, selectedState: BoneSelectedState) {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectBone(id, selectedState, true, true)
  }

  function selectAll() {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectAllBone()
  }

  function mousemove(arg: EditMovement) {
    if (state.command) {
      state.editMovement = arg
    }
  }

  function clip() {
    state.clipboard = mapReduce(animationStore.selectedAllBones.value, (b) =>
      animationStore.getCurrentSelfTransforms(b.id)
    )
  }

  function paste() {
    if (Object.keys(state.clipboard).length === 0) return
    animationStore.pastePoses(state.clipboard)
  }

  const availableCommandList = computed(() => {
    if (state.command === 'grab') {
      return [
        { command: 'x', title: 'Fix Axis X' },
        { command: 'y', title: 'Fix Axis Y' },
      ]
    } else if (isAnySelected.value) {
      return [
        { command: 'i', title: 'Insert Keyframe' },
        { command: 'g', title: 'Grab' },
        { command: 'r', title: 'Rotate' },
        { command: 'a', title: 'All Select' },
        { command: 'Ctrl + c', title: 'Clip' },
        { command: 'Ctrl + v', title: 'Paste' },
      ]
    } else {
      return [
        { command: 'a', title: 'All Select' },
        { command: 'Ctrl + v', title: 'Paste' },
      ]
    }
  })

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
    execDelete: () => {},
    execAdd: () => {},
    clip,
    paste,
    duplicate: () => {},
    availableCommandList,
  }
}
