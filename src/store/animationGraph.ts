/*
This file is part of Blendic SVG.

Blendic SVG is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Blendic SVG is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Blendic SVG.  If not, see <https://www.gnu.org/licenses/>.

Copyright (C) 2021, Tomoya Komiyama.
*/

import { computed } from 'vue'
import {
  AnimationGraph,
  BElement,
  getAnimationGraph,
  IdMap,
  toMap,
} from '../models'
import { extractMap, toList } from '../utils/commons'
import { useHistoryStore } from './history'
import { useEntities } from '/@/composables/stores/entities'
import { SelectOptions } from '/@/composables/modes/types'
import { useItemSelectable } from '/@/composables/stores/selectable'
import { HistoryStore } from '/@/composables/stores/history'
import { fromEntityList, toEntityList } from '/@/models/entity'
import { GraphNode, GraphNodes, GraphNodeType } from '/@/models/graphNode'
import {
  cleanAllEdgeGenerics,
  createGraphNode,
  deleteAndDisconnectNodes,
  resolveAllNodes,
} from '/@/utils/graphNodes'
import { getNotDuplicatedName } from '/@/utils/relations'
import { useStore } from '/@/store'
import { useElementStore } from '/@/store/element'
import { createGraphNodeContext } from '/@/utils/elements'
import { useAnimationStore } from '/@/store/animation'

interface StoreContext {
  getArmatureId: () => string | undefined
  getCurrentFrame: () => number
  getEndFrame: () => number
  getElementMap: (armatureId: string) => IdMap<BElement>
}

export function createStore(
  historyStore: HistoryStore,
  storeContext: StoreContext
) {
  const graphEntities = useEntities<AnimationGraph>('Graph')
  const nodeEntities = useEntities<GraphNode>('Node')

  const graphSelectable = useItemSelectable(
    'Graph',
    () => graphEntities.entities.value.byId
  )
  const nodeSelectable = useItemSelectable('Node', () => nodeMap.value)

  historyStore.defineReducers(graphEntities.reducers)
  historyStore.defineReducers(nodeEntities.reducers)
  historyStore.defineReducers(graphSelectable.reducers)
  historyStore.defineReducers(nodeSelectable.reducers)

  const graphs = computed(() => toEntityList(graphEntities.entities.value))
  const lastSelectedGraphId = graphSelectable.lastSelectedId
  const lastSelectedGraph = computed(() =>
    graphSelectable.lastSelectedId.value
      ? graphEntities.entities.value.byId[graphSelectable.lastSelectedId.value]
      : undefined
  )

  const nodeMap = computed(() => {
    if (!lastSelectedGraph.value) return {}

    const nodeById = nodeEntities.entities.value.byId
    return toMap(lastSelectedGraph.value.nodes.map((id) => nodeById[id]))
  })
  const selectedNodes = nodeSelectable.selectedMap
  const lastSelectedNodeId = nodeSelectable.lastSelectedId
  const lastSelectedNode = computed(() =>
    lastSelectedNodeId.value
      ? nodeEntities.entities.value.byId[lastSelectedNodeId.value]
      : undefined
  )

  const targetArmatureId = computed(storeContext.getArmatureId)

  const resolvedGraphContext = computed(() => {
    if (!lastSelectedGraph.value) return

    const context = createGraphNodeContext(
      storeContext.getElementMap(lastSelectedGraph.value.armatureId),
      {
        currentFrame: storeContext.getCurrentFrame(),
        endFrame: storeContext.getEndFrame(),
      }
    )
    resolveAllNodes(context, nodeMap.value)
    return context
  })

  function initState(
    graphs: AnimationGraph[],
    nodes: GraphNode[],
    graphSelected: [string, true][],
    nodeSelected: [string, true][]
  ) {
    graphEntities.init(fromEntityList(graphs))
    nodeEntities.init(fromEntityList(nodes))
    graphSelectable.restore(graphSelected)
    nodeSelectable.restore(nodeSelected)
  }

  function exportState() {
    return {
      graphs: graphs.value,
      nodes: toEntityList(nodeEntities.entities.value),
      graphSelected: graphSelectable.createSnapshot(),
      nodeSelected: nodeSelectable.createSnapshot(),
    }
  }

  function selectGraph(id: string = '') {
    if (!graphSelectable.getSelectHistoryDryRun(id)) return

    historyStore.dispatch(graphSelectable.createSelectAction(id), [
      nodeSelectable.createClearAllAction(),
    ])
  }

  function addGraph(arg: Partial<{ id: string; name: string }> = {}) {
    if (!targetArmatureId.value) return

    const graph = getAnimationGraph(
      {
        id: arg.id,
        name: getNotDuplicatedName(
          arg.name ?? 'Graph',
          graphs.value.map((g) => g.name)
        ),
        armatureId: targetArmatureId.value,
      },
      !arg.id
    )
    historyStore.dispatch(graphEntities.createAddAction([graph]), [
      nodeSelectable.createClearAllAction(),
      graphSelectable.createSelectAction(graph.id),
    ])
  }

  function deleteGraph() {
    const graph = lastSelectedGraph.value
    if (!graph) return

    historyStore.dispatch(graphEntities.createDeleteAction([graph.id]), [
      nodeEntities.createDeleteAction(graph.nodes),
      nodeSelectable.createClearAllAction(),
      graphSelectable.createClearAllAction(),
    ])
  }

  function updateGraph(graph: Partial<AnimationGraph>) {
    if (!lastSelectedGraphId.value) return

    historyStore.dispatch(
      graphEntities.createUpdateAction({
        [lastSelectedGraphId.value]: graph,
      })
    )
  }

  function selectNode(id = '', options?: SelectOptions) {
    if (
      !lastSelectedGraph.value ||
      !nodeSelectable.getSelectHistoryDryRun(id, options?.shift)
    )
      return

    historyStore.dispatch(nodeSelectable.createSelectAction(id, options?.shift))
  }

  function selectNodes(ids: IdMap<boolean>, options?: SelectOptions) {
    const idList = Object.keys(ids)
    if (!nodeSelectable.getMultiSelectHistoryDryRun(idList, options?.shift))
      return

    historyStore.dispatch(
      nodeSelectable.createMultiSelectAction(idList, options?.shift)
    )
  }

  function selectAllNode() {
    if (Object.keys(nodeMap.value).length === 0) return
    historyStore.dispatch(nodeSelectable.createSelectAllAction(true))
  }

  /**
   * Add new node
   * If no graph is selected, create new graph
   */
  function addNode<T extends GraphNodeType>(
    type: T,
    arg: Partial<GraphNodes[T]> = {}
  ): GraphNode | undefined {
    if (!lastSelectedGraphId.value) {
      addGraph()
    }
    const graph = lastSelectedGraph.value
    if (!graph) return

    const node = createGraphNode(type, arg, !arg.id)

    historyStore.dispatch(nodeEntities.createAddAction([node]), [
      graphEntities.createUpdateAction({
        [graph.id]: {
          nodes: [...graph.nodes, node.id],
        },
      }),
      nodeSelectable.createSelectAction(node.id),
    ])
    return node
  }

  function pasteNodes(nodes: GraphNode[]) {
    const graph = lastSelectedGraph.value
    if (!graph || nodes.length === 0) return

    historyStore.dispatch(nodeEntities.createAddAction(nodes), [
      graphEntities.createUpdateAction({
        [graph.id]: {
          nodes: graph.nodes.concat(nodes.map((n) => n.id)),
        },
      }),
      nodeSelectable.createMultiSelectAction(nodes.map((n) => n.id)),
    ])
  }

  function deleteNodes() {
    if (!lastSelectedGraph.value) return

    const deleteIds = selectedNodes.value

    const deletedInfo = deleteAndDisconnectNodes(
      toList(nodeMap.value),
      deleteIds
    )

    const nodeMapByDelete = toMap(deletedInfo.nodes)

    const updatedNodesByDisconnect = extractMap(
      nodeMapByDelete,
      deletedInfo.updatedIds
    )
    const updatedNodesByClean = cleanAllEdgeGenerics({
      ...nodeMapByDelete,
      ...updatedNodesByDisconnect,
    })

    const graph = lastSelectedGraph.value
    if (!graph) return

    const deletedIds = selectedNodes.value

    historyStore.dispatch(
      nodeEntities.createDeleteAction(Object.keys(deletedIds)),
      [
        nodeEntities.createUpdateAction({
          ...updatedNodesByDisconnect,
          ...updatedNodesByClean,
        }),
        graphEntities.createUpdateAction({
          [graph.id]: {
            nodes: graph.nodes.filter((id) => !deletedIds[id]),
          },
        }),
        nodeSelectable.createClearAllAction(),
      ]
    )
  }

  function updateNode(id: string, val: Partial<GraphNode>, seriesKey?: string) {
    if (!lastSelectedGraph.value) return

    historyStore.dispatch(
      nodeEntities.createUpdateAction({ [id]: val }, seriesKey)
    )
  }

  function updateNodes(val: IdMap<Partial<GraphNode>>) {
    if (!lastSelectedGraph.value) return

    historyStore.dispatch(nodeEntities.createUpdateAction(val))
  }

  return {
    initState,
    exportState,

    graphs,
    lastSelectedGraph,

    nodeMap,
    lastSelectedNode,
    selectedNodes,
    targetArmatureId,
    resolvedGraphContext,

    selectGraph,
    addGraph,
    deleteGraph,
    updateGraph,

    selectNode,
    selectNodes,
    selectAllNode,
    addNode,
    deleteNodes,
    pasteNodes,
    updateNode,
    updateNodes,
  }
}
export type AnimationGraphStore = ReturnType<typeof createStore>

const store = createStore(useHistoryStore(), {
  getArmatureId: () => useStore().lastSelectedArmatureId.value,
  getCurrentFrame: () => useAnimationStore().currentFrame.value,
  getEndFrame: () => useAnimationStore().endFrame.value,
  getElementMap: (armatureId: string) => {
    const elementStore = useElementStore()
    return elementStore.lastSelectedActor.value?.armatureId === armatureId
      ? elementStore.elementMap.value
      : {}
  },
})
export function useAnimationGraphStore() {
  return store
}
