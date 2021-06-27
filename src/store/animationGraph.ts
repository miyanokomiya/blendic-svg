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
import { extractMap, mapReduce, toList } from '../utils/commons'
import { useHistoryStore } from './history'
import { SelectOptions } from '/@/composables/modes/types'
import { HistoryItem } from '/@/composables/stores/history'
import { GraphNode, GraphNodes, GraphNodeType } from '/@/models/graphNode'
import { createGraphNode } from '/@/utils/graphNodes'
import {
  convolute,
  getAddItemHistory,
  getAddItemsHistory,
  getDeleteItemHistory,
  getSelectItemHistory,
  getSelectItemsHistory,
  LastSelectedItemIdAccessor,
  ListItemAccessor,
  SelectedItemAccessor,
} from '/@/utils/histories'

const historyStore = useHistoryStore()

const graphState = useListState<AnimationGraph>('Graph')
const selectedNodes = ref<IdMap<boolean>>({})
const lastSelectedNodeId = ref<string>('')

function initState(graph: AnimationGraph[]) {
  graphState.initState()
  graphState.state.list = graph
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
    const item = getSelectAllItem()
    historyStore.push(item, true)
  }
}

function updateArmatureId(id: string) {
  if (!lastSelectedGraph.value) return

  const item = getUpdateArmatureIdItem(id)
  historyStore.push(item, true)
}

function updateNode(id: string, val: Partial<GraphNode>, seriesKey?: string) {
  if (!lastSelectedGraph.value) return

  const item = getUpdateNodesItem({ [id]: val }, seriesKey)
  historyStore.push(item, true)
}

function updateNodes(val: IdMap<Partial<GraphNode>>) {
  if (!lastSelectedGraph.value) return

  const item = getUpdateNodesItem(val)
  historyStore.push(item, true)
}

function addNode<T extends GraphNodeType>(
  type: T,
  arg: Partial<GraphNodes[T]> = {}
) {
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

  const item = convolute(
    getDeleteItemHistory(nodesAccessor, selectedNodes.value),
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

    updateArmatureId,
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

export function getSelectAllItem(): HistoryItem {
  const current = { ...selectedNodes.value }
  const currentLast = lastSelectedNodeId.value

  const redo = () => {
    selectedNodes.value = mapReduce(nodeMap.value, () => true)
    lastSelectedNodeId.value = Object.keys(nodeMap)[0] ?? ''
  }
  return {
    name: 'Select All Node',
    undo: () => {
      selectedNodes.value = { ...current }
      lastSelectedNodeId.value = currentLast
    },
    redo,
  }
}

export function getUpdateArmatureIdItem(id: string): HistoryItem {
  const current = lastSelectedGraph.value!.armatureId
  const currentNodes = nodeMap.value

  const redo = () => {
    lastSelectedGraph.value!.armatureId = id
    lastSelectedGraph.value!.nodes = lastSelectedGraph.value!.nodes.map(
      (e) => ({
        ...e,
        boneId: '',
      })
    )
  }
  return {
    name: 'Update Parent',
    undo: () => {
      lastSelectedGraph.value!.armatureId = current
      lastSelectedGraph.value!.nodes = toList(currentNodes)
    },
    redo,
  }
}

export function getUpdateNodesItem(
  val: IdMap<Partial<GraphNode>>,
  seriesKey?: string
): HistoryItem {
  const current = extractMap(nodeMap.value, val)

  const redo = () => {
    lastSelectedGraph.value!.nodes = toList({
      ...nodeMap.value,
      ...mapReduce(current, (n, id) => ({ ...n, ...val[id] } as GraphNode)),
    })
  }
  return {
    name: 'Update Node',
    undo: () => {
      lastSelectedGraph.value!.nodes = toList({
        ...nodeMap.value,
        ...current,
      })
    },
    redo,
    seriesKey,
  }
}
