import { reactive, computed, watch, ref } from 'vue'
import { useStore } from '.'
import { useListState } from '../composables/listState'
import { getNextName } from '../utils/relations'
import { Action, getAction } from '/@/models'

const currentFrame = ref(0)
const endFrame = ref(60)
const actions = useListState<Action>('Action')

const store = useStore()

function addAction() {
  if (!store.lastSelectedArmature.value) return

  actions.addItem(
    getAction(
      {
        name: getNextName(
          'action',
          actions.state.list.map((a) => a.name)
        ),
        armatureId: store.lastSelectedArmature.value.id,
      },
      true
    )
  )
}

function setEndFrame(val: number) {
  endFrame.value = val
}

export function useAnimationStore() {
  return {
    currentFrame,
    endFrame,
    actions: actions.state.list,
    setEndFrame,
    selectedAction: actions.lastSelectedItem,
    selectAction: actions.selectItem,
    addAction,
    deleteAction: actions.deleteItem,
    updateAction: (action: Partial<Action>) => actions.updateItem(action),
  }
}
