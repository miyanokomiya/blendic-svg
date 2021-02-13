import { ref, reactive, computed } from 'vue'
import { getDistance, IVec2, multi, sub } from 'okageo'
import {
  Transform,
  Armature,
  Born,
  getTransform,
  BornSelectedState,
  EditMode,
  IdMap,
} from '../models/index'
import {
  findBorn,
  editTransform,
  extrudeFromParent,
  updateConnections,
} from '/@/utils/armatures'
import { getNextName } from '/@/utils/relations'
import { useStore } from '/@/store/index'

type EditMovement = { current: IVec2; start: IVec2 }

interface State {
  editMode: EditMode
  editMovement: EditMovement | undefined
}

export function useBornEditMode() {
  const state = reactive<State>({
    editMode: '',
    editMovement: undefined,
  })

  const store = useStore()
  const selectedBorns = computed(() => store.state.selectedBorns)
  const lastSelectedBornId = computed(() => store.state.lastSelectedBornId)

  const newBornIds = ref<string[]>([])
  const pastSelectedBorns = ref<IdMap<BornSelectedState>>()

  const target = ref<Armature>()

  const isAnySelected = computed(() => !!lastSelectedBornId.value)

  const allNames = computed(() => target.value?.borns.map((a) => a.name) ?? [])

  function cancelEdit() {
    if (state.editMode === 'extrude') {
      if (target.value) {
        // revert extruded borns
        target.value.borns = target.value.borns.filter(
          (b) => !selectedBorns.value[b.id]
        )
      }
      store.setSelectedBorns(
        pastSelectedBorns.value ? { ...pastSelectedBorns.value } : {}
      )
    }

    state.editMode = ''
    state.editMovement = undefined
    newBornIds.value = []

    pastSelectedBorns.value = undefined
  }

  function cancel() {
    cancelEdit()
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
      store.setSelectedBorns({})
    }
  }

  function extrude(parent: Born, fromHead = false): Born {
    return {
      ...extrudeFromParent(parent, fromHead),
    }
  }

  function addBorn(born: Born) {
    target.value!.borns.push(born)
    newBornIds.value.push(born.id)
    store.shiftSelectBorn(born.id, { tail: true })
  }

  function setEditMode(mode: EditMode) {
    if (!target.value) return

    cancelEdit()
    if (isAnySelected.value) {
      state.editMode = mode
      if (mode === 'extrude') {
        pastSelectedBorns.value = { ...selectedBorns.value }
        store.setSelectedBorns({})
        const shouldSkipBorns: IdMap<boolean> = {}
        Object.keys(pastSelectedBorns.value).forEach((id) => {
          const selectedState = pastSelectedBorns.value![id]
          const parent = findBorn(target.value!.borns, id)!

          const borns: Born[] = []
          if (selectedState.tail) {
            borns.push(extrude(parent))
          }
          if (selectedState.head) {
            borns.push(extrude(parent, true))
          }
          borns.forEach((b) => {
            // prevent to extruding from same parent
            if (!shouldSkipBorns[b.parentId]) {
              b.name = getNextName(parent.name, allNames.value)
              addBorn(b)
              shouldSkipBorns[b.parentId] = true
            }
          })
        })
      }
    }
  }

  const editTransforms = computed(() => {
    if (!state.editMovement) return {}

    const translate = sub(state.editMovement.current, state.editMovement.start)

    if (state.editMode === 'scale') {
      const origin = store.selectedBornsOrigin.value
      const scale = multi(
        { x: 1, y: 1 },
        getDistance(state.editMovement.current, origin) /
          getDistance(state.editMovement.start, origin)
      )
      return Object.keys(selectedBorns.value).reduce<IdMap<Transform[]>>(
        (map, id) => {
          map[id] = [getTransform({ origin, scale })]
          return map
        },
        {}
      )
    }

    return Object.keys(selectedBorns.value).reduce<IdMap<Transform[]>>(
      (map, id) => {
        map[id] = [getTransform({ translate })]
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
    store.updateBornConnections()
    state.editMovement = undefined
    state.editMode = ''
    pastSelectedBorns.value = undefined
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
    store.shiftSelectBorn(id, selectedState)
  }

  function mousemove(arg: EditMovement) {
    if (state.editMode) {
      state.editMovement = arg
    }
  }

  return {
    state,
    getEditTransforms(id: string) {
      return editTransforms.value[id] || []
    },
    begin: (armature: Armature) => (target.value = armature),
    end() {
      cancel()
      target.value = undefined
    },
    setEditMode,
    select,
    shiftSelect,
    mousemove,
    clickAny,
    clickEmpty,
  }
}
