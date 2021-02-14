import { reactive, computed, watch } from 'vue'
import { useStore } from '.'
import { useListState } from '../composables/listState'
import { getNextName } from '../utils/relations'
import { Action, getAction } from '/@/models'

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

export function useAnimationStore() {
  return {
    actions: actions.state.list,
    selectedAction: actions.lastSelectedItem,
    selectAction: actions.selectItem,
    addAction,
    deleteAction: actions.deleteItem,
    updateAction: (action: Partial<Action>) => actions.updateItem(action),
  }
}
