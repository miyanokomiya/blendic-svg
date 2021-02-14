import { reactive, computed, watch } from 'vue'
import { useListState } from '../composables/listState'
import { getNextName } from '../utils/relations'
import { Action, getAction } from '/@/models'

const actions = useListState<Action>('Action')

function addAction() {
  actions.addItem(
    getAction(
      {
        name: getNextName(
          'action',
          actions.state.list.map((a) => a.name)
        ),
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
