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

import { computed, ref } from 'vue'
import { useListState } from '../composables/listState'
import { AnimationGraph, IdMap, toMap } from '../models'
import { extractMap, mapReduce } from '../utils/commons'
import { useHistoryStore } from './history'
import { SelectOptions } from '/@/composables/modes/types'
import { GraphNode, GraphNodes, GraphNodeType } from '/@/models/graphNode'
import {
  cleanAllEdgeGenerics,
  createGraphNode,
  deleteAndDisconnectNodes,
} from '/@/utils/graphNodes'
import {
  convolute,
  getAddItemHistory,
  getAddItemsHistory,
  getDeleteAndUpdateItemHistory,
  getSelectItemHistory,
  getSelectItemsHistory,
  getUpdateItemHistory,
  LastSelectedItemIdAccessor,
  ListItemAccessor,
  SelectedItemAccessor,
} from '/@/utils/histories'

const historyStore = useHistoryStore()

const graphState = useListState<AnimationGraph>('Graph')
const selectedNodes = ref<IdMap<boolean>>({})
const lastSelectedNodeId = ref<string>('')

function initState(graphs: AnimationGraph[]) {
  graphState.initState()
  graphState.state.list = graphs
  selectedNodes.value = {}
  lastSelectedNodeId.value = ''
}

const lastSelectedGraph = computed(() => {
  return graphState.lastSelectedItem.value
})

const nodeMap = computed(() => toMap(lastSelectedGraph.value?.nodes ?? []))

const lastSelectedNode = computed(() => {
  if (!lastSelectedNodeId.value) return
  return nodeMap.value[lastSelectedNodeId.value]
})

const selectedNodeCount = computed(() => {
  return Object.keys(selectedNodes.value).length
})

const nodesAccessor: ListItemAccessor<GraphNode> = {
  get: () => lastSelectedGraph.value?.nodes ?? [],
  set: (val) => {
    if (!lastSelectedGraph.value) return
    lastSelectedGraph.value.nodes = val
  },
}

const selectedNodesAccessor: SelectedItemAccessor = {
  get: () => selectedNodes.value,
  set: (val) => {
    if (!lastSelectedGraph.value) return
    selectedNodes.value = val
  },
}

const lastSelectedNodeIdAccessor: LastSelectedItemIdAccessor = {
  get: () => lastSelectedNodeId.value ?? '',
  set: (val) => {
    if (!lastSelectedGraph.value) return
    lastSelectedNodeId.value = val
  },
}

function selectNode(id = '', options?: SelectOptions) {
  if (!id && Object.keys(selectedNodes.value).length === 0) return
  if (
    !options?.shift &&
    id === lastSelectedNodeId.value &&
    selectedNodeCount.value === 1
  )
    return

  const item = getSelectItemHistory(
    selectedNodesAccessor,
    lastSelectedNodeIdAccessor,
    id,
    options?.shift
  )
  historyStore.push(item, true)
}

function selectNodes(ids: IdMap<boolean>, options?: SelectOptions) {
  if (
    Object.keys(ids).sort().join(',') ===
    Object.keys(selectedNodes.value).sort().join(',')
  )
    return

  const item = getSelectItemsHistory(
    selectedNodesAccessor,
    lastSelectedNodeIdAccessor,
    ids,
    options?.shift
  )
  historyStore.push(item, true)
}

function selectAllNode() {
  if (Object.keys(nodeMap.value).length === 0) return

  if (selectedNodeCount.value === Object.keys(nodeMap.value).length) {
    selectNode('')
  } else {
    const item = getSelectItemsHistory(
      selectedNodesAccessor,
      lastSelectedNodeIdAccessor,
      mapReduce(nodeMap.value, () => true)
    )
    historyStore.push(item, true)
  }
}

function updateNode(id: string, val: Partial<GraphNode>, seriesKey?: string) {
  if (!lastSelectedGraph.value) return

  const item = getUpdateItemHistory(nodesAccessor, { [id]: val }, seriesKey)
  historyStore.push(item, true)
}

function updateNodes(val: IdMap<Partial<GraphNode>>) {
  if (!lastSelectedGraph.value) return

  const item = getUpdateItemHistory(nodesAccessor, val)
  historyStore.push(item, true)
}

function addNode<T extends GraphNodeType>(
  type: T,
  arg: Partial<GraphNodes[T]> = {}
): GraphNode | undefined {
  if (!lastSelectedGraph.value) return

  const node = createGraphNode(type, arg, true)
  const item = convolute(getAddItemHistory(nodesAccessor, node), [
    getSelectItemHistory(
      selectedNodesAccessor,
      lastSelectedNodeIdAccessor,
      node.id
    ),
  ])
  historyStore.push(item, true)
  return node
}

function pasteNodes(nodes: GraphNode[]) {
  if (!lastSelectedGraph.value || nodes.length === 0) return

  const item = convolute(getAddItemsHistory(nodesAccessor, nodes), [
    getSelectItemsHistory(
      selectedNodesAccessor,
      lastSelectedNodeIdAccessor,
      mapReduce(toMap(nodes), () => true)
    ),
  ])
  historyStore.push(item, true)
}

function deleteNodes() {
  if (!lastSelectedGraph.value) return

  const deleteIds = selectedNodes.value

  const deletedInfo = deleteAndDisconnectNodes(
    lastSelectedGraph.value.nodes,
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

  const item = convolute(
    getDeleteAndUpdateItemHistory(nodesAccessor, deleteIds, {
      ...updatedNodesByDisconnect,
      ...updatedNodesByClean,
    }),
    [
      getSelectItemHistory(
        selectedNodesAccessor,
        lastSelectedNodeIdAccessor,
        ''
      ),
    ]
  )
  historyStore.push(item, true)
}

export function useAnimationGraphStore() {
  return {
    initState,
    graphList: computed(() => graphState.state.list),
    nodeMap,
    lastSelectedGraph,
    lastSelectedNode,

    selectGraph: (id: string) => graphState.selectItem(id),
    updateGraph: (val: Partial<AnimationGraph>) => graphState.updateItem(val),
    addGraph: (graph: AnimationGraph) => {
      graphState.addItem(graph, true)
    },
    deleteGraph() {
      graphState.deleteItem()
    },

    updateNode,
    updateNodes,
    addNode,
    pasteNodes,
    deleteNodes,

    selectedNodes,
    selectNode,
    selectNodes,
    selectAllNode,
  }
}
export type AnimationGraphStore = ReturnType<typeof useAnimationGraphStore>
