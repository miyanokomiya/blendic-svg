import { computed } from 'vue'
import { useListState } from '../composables/listState'
import { Actor } from '../models'

const actorsState = useListState<Actor>('Actor')

const lastSelectedActor = computed(() => {
  return actorsState.lastSelectedItem.value
})

function initState(actors: Actor[]) {
  actorsState.state.list = actors
  if (actors.length > 0) {
    actorsState.state.lastSelectedId = actors[0].id
    actorsState.state.selectedMap = { [actors[0].id]: true }
  }
}

export function useElementStore() {
  return {
    initState,
    actors: computed(() => actorsState.state.list),
    lastSelectedActor,
  }
}
