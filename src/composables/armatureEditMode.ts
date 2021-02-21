import { reactive, computed } from 'vue'
import { getDistance, getRadian, multi, sub } from 'okageo'
import {
  Transform,
  Born,
  getTransform,
  BornSelectedState,
  EditMode,
  IdMap,
  CanvasEditModeBase,
  EditMovement,
} from '../models/index'
import {
  duplicateBorns,
  editTransform,
  extrudeFromParent,
} from '/@/utils/armatures'
import { getNextName } from '/@/utils/relations'
import { useStore } from '/@/store/index'
import { CanvasStore } from '/@/store/canvas'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
}

export interface BornEditMode extends CanvasEditModeBase {}

export function useBornEditMode(canvasStore: CanvasStore): BornEditMode {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
  })

  const store = useStore()
  const selectedBorns = computed(() => store.state.selectedBorns)
  const lastSelectedBornId = computed(() => store.lastSelectedBorn.value?.id)

  const target = computed(() => store.lastSelectedArmature.value)

  const isAnySelected = computed(() => !!lastSelectedBornId.value)

  const allNames = computed(() => target.value?.borns.map((a) => a.name) ?? [])

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

  function extrude(parent: Born, fromHead = false): Born {
    return {
      ...extrudeFromParent(parent, fromHead),
    }
  }

  function setEditMode(mode: EditMode) {
    if (!target.value) return

    cancel()

    if (isAnySelected.value) {
      state.command = mode
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

    if (state.command === 'scale') {
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
      return Object.keys(selectedBorns.value).reduce<IdMap<Transform>>(
        (map, id) => {
          map[id] = getTransform({ origin, scale: snappedScale })
          return map
        },
        {}
      )
    }

    if (state.command === 'rotate') {
      const origin = store.selectedBornsOrigin.value
      const rotate =
        ((getRadian(state.editMovement.current, origin) -
          getRadian(state.editMovement.start, origin)) /
          Math.PI) *
        180
      return Object.keys(selectedBorns.value).reduce<IdMap<Transform>>(
        (map, id) => {
          map[id] = getTransform({
            origin,
            rotate,
          })
          return map
        },
        {}
      )
    }

    const translate = sub(state.editMovement.current, state.editMovement.start)
    const snappedTranslate = canvasStore.snapTranslate(translate)
    return Object.keys(selectedBorns.value).reduce<IdMap<Transform>>(
      (map, id) => {
        map[id] = getTransform({ translate: snappedTranslate })
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

  function selectAll() {
    if (state.command) {
      completeEdit()
      return
    }
    store.selectAllBorn()
  }

  function mousemove(arg: EditMovement) {
    if (state.command) {
      state.editMovement = arg
    }
  }

  function execDelete() {
    if (state.command === '') {
      store.deleteBorn()
    }
  }

  function execAdd() {
    if (state.command === '') {
      store.addBorn()
    }
  }

  function duplicate() {
    if (state.command === '') {
      const srcBorns = store.allSelectedBorns.value
      const names = allNames.value.concat()
      store.addBorns(duplicateBorns(srcBorns, names), {
        head: true,
        tail: true,
      })
      setEditMode('grab')
    }
  }

  return {
    command: computed(() => state.command),
    getEditTransforms(id: string) {
      return editTransforms.value[id] || getTransform()
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
    execAdd,
    clip: () => {},
    paste: () => {},
    duplicate,
  }
}
