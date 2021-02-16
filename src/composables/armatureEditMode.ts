import { ref, reactive, computed } from 'vue'
import { getDistance, getRadian, IVec2, multi, sub } from 'okageo'
import {
  Transform,
  Armature,
  Born,
  getTransform,
  BornSelectedState,
  EditMode,
  IdMap,
  CanvasEditModeBase,
  EditMovement,
} from '../models/index'
import { editTransform, extrudeFromParent } from '/@/utils/armatures'
import { getNextName } from '/@/utils/relations'
import { useStore } from '/@/store/index'
import { useCanvasStore } from '/@/store/canvas'

interface State {
  editMode: EditMode
  editMovement: EditMovement | undefined
}

export interface BornEditMode extends CanvasEditModeBase {
  state: State
  getEditTransforms: (id: string) => Transform[]
}

export function useBornEditMode(): BornEditMode {
  const state = reactive<State>({
    editMode: '',
    editMovement: undefined,
  })

  const store = useStore()
  const canvasStore = useCanvasStore()
  const selectedBorns = computed(() => store.state.selectedBorns)
  const lastSelectedBornId = computed(() => store.lastSelectedBorn.value?.id)

  const target = computed(() => store.lastSelectedArmature.value)

  const isAnySelected = computed(() => !!lastSelectedBornId.value)

  const allNames = computed(() => target.value?.borns.map((a) => a.name) ?? [])

  function cancel() {
    state.editMode = ''
    state.editMovement = undefined
  }

  function clickAny() {
    if (state.editMode) {
      completeEdit()
    }
  }

  function clickEmpty() {
    if (state.editMode) {
      completeEdit()
    } else {
      store.selectBorn()
    }
  }

  function extrude(parent: Born, fromHead = false): Born {
    return {
      ...extrudeFromParent(parent, fromHead),
    }
  }

  function setEditMode(mode: EditMode) {
    if (!target.value) return

    cancel()

    if (isAnySelected.value) {
      state.editMode = mode
      if (mode === 'extrude') {
        const shouldSkipBorns: IdMap<boolean> = {}
        const names = allNames.value.concat()
        const extrudedBorns: Born[] = []

        Object.keys(selectedBorns.value).forEach((id) => {
          const selectedState = selectedBorns.value[id]
          const parent = store.bornMap.value[id]

          const borns: Born[] = []
          if (selectedState.tail) borns.push(extrude(parent))
          if (selectedState.head) borns.push(extrude(parent, true))

          borns.forEach((b) => {
            // prevent to extruding from same parent
            if (!shouldSkipBorns[b.parentId]) {
              b.name = getNextName(parent.name, names)
              extrudedBorns.push(b)
              names.push(b.name)
              shouldSkipBorns[b.parentId] = true
            }
          })
        })

        store.addBorns(extrudedBorns, { tail: true })
      }
    }
  }

  const editTransforms = computed(() => {
    if (!state.editMovement) return {}

    if (state.editMode === 'scale') {
      const origin = store.selectedBornsOrigin.value
      const isOppositeSide = canvasStore.isOppositeSide(
        origin,
        state.editMovement.start,
        state.editMovement.current
      )
      const scale = multi(
        multi({ x: 1, y: 1 }, isOppositeSide ? -1 : 1),
        getDistance(state.editMovement.current, origin) /
          getDistance(state.editMovement.start, origin)
      )
      const snappedScale = canvasStore.snapScale(scale)
      return Object.keys(selectedBorns.value).reduce<IdMap<Transform[]>>(
        (map, id) => {
          map[id] = [getTransform({ origin, scale: snappedScale })]
          return map
        },
        {}
      )
    }

    if (state.editMode === 'rotate') {
      const origin = store.selectedBornsOrigin.value
      const rotate =
        ((getRadian(state.editMovement.current, origin) -
          getRadian(state.editMovement.start, origin)) /
          Math.PI) *
        180
      return Object.keys(selectedBorns.value).reduce<IdMap<Transform[]>>(
        (map, id) => {
          map[id] = [
            getTransform({
              origin,
              rotate,
            }),
          ]
          return map
        },
        {}
      )
    }

    const translate = sub(state.editMovement.current, state.editMovement.start)
    const snappedTranslate = canvasStore.snapTranslate(translate)
    return Object.keys(selectedBorns.value).reduce<IdMap<Transform[]>>(
      (map, id) => {
        map[id] = [getTransform({ translate: snappedTranslate })]
        return map
      },
      {}
    )
  })

  const editedBornMap = computed(
    (): IdMap<Born> =>
      Object.keys(editTransforms.value).reduce<IdMap<Born>>((m, id) => {
        m[id] = editTransform(
          store.bornMap.value[id],
          editTransforms.value[id],
          selectedBorns.value[id]
        )
        return m
      }, {})
  )

  function completeEdit() {
    if (!target.value) return

    store.updateBorns(editedBornMap.value)
    state.editMovement = undefined
    state.editMode = ''
  }

  function select(id: string, selectedState: BornSelectedState) {
    if (state.editMode) {
      completeEdit()
      return
    }
    store.selectBorn(id, selectedState)
  }

  function shiftSelect(id: string, selectedState: BornSelectedState) {
    if (state.editMode) {
      completeEdit()
      return
    }
    store.selectBorn(id, selectedState, true)
  }

  function mousemove(arg: EditMovement) {
    if (state.editMode) {
      state.editMovement = arg
    }
  }

  function execDelete() {
    if (canvasStore.canvasEditMode.value?.state.editMode === '') {
      store.deleteBorn()
    }
  }

  function execAdd() {
    if (canvasStore.canvasEditMode.value?.state.editMode === '') {
      store.addBorn()
    }
  }

  return {
    state,
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
