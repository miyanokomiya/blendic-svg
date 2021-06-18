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
import { GraphNode } from '/@/models/graphNode'

const historyStore = useHistoryStore()

const graphState = useListState<AnimationGraph>('Graph')
const selectedNodes = ref<IdMap<boolean>>({})
const lastSelectedNodeId = ref<string>()

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

function initState(graph: AnimationGraph[]) {
  graphState.state.list = graph
}

function selectNode(id = '', options?: SelectOptions) {
  if (!id && Object.keys(selectedNodes.value).length === 0) return
  if (
    !options?.shift &&
    id === lastSelectedNodeId.value &&
    selectedNodeCount.value === 1
  )
    return

  const item = getSelectItem(id, options?.shift)
  item.redo()
  historyStore.push(item)
}

function selectAllNode() {
  if (Object.keys(nodeMap.value).length === 0) return

  if (selectedNodeCount.value === Object.keys(nodeMap.value).length) {
    selectNode('')
  } else {
    const item = getSelectAllItem()
    item.redo()
    historyStore.push(item)
  }
}

function updateArmatureId(id: string) {
  if (!lastSelectedNode.value) return

  const item = getUpdateArmatureIdItem(id)
  item.redo()
  historyStore.push(item)
}

function updateNode(id: string, val: Partial<GraphNode>) {
  if (!lastSelectedNode.value) return

  const item = getUpdateNodesItem({ [id]: val })
  item.redo()
  historyStore.push(item)
}

function updateNodes(val: IdMap<Partial<GraphNode>>) {
  if (!lastSelectedNode.value) return

  const item = getUpdateNodesItem(val)
  item.redo()
  historyStore.push(item)
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

    selectedNodes,
    selectNode,
    selectAllNode,
  }
}
export type AnimationGraphStore = ReturnType<typeof useAnimationGraphStore>

export function getSelectItem(id: string, shift = false): HistoryItem {
  const current = { ...selectedNodes.value }
  const currentLast = lastSelectedNodeId.value

  const redo = () => {
    if (shift) {
      if (selectedNodes.value[id]) {
        delete selectedNodes.value[id]
        if (lastSelectedNodeId.value === id) {
          lastSelectedNodeId.value = ''
        }
      } else {
        selectedNodes.value[id] = true
        lastSelectedNodeId.value = id
      }
    } else {
      selectedNodes.value = id ? { [id]: true } : {}
      lastSelectedNodeId.value = id
    }

    if (!lastSelectedNodeId.value && selectedNodeCount.value > 0) {
      lastSelectedNodeId.value = Object.keys(selectedNodes.value)[0]
    }
  }
  return {
    name: 'Select Node',
    undo: () => {
      selectedNodes.value = { ...current }
      lastSelectedNodeId.value = currentLast
    },
    redo,
  }
}

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
  val: IdMap<Partial<GraphNode>>
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
  }
}
