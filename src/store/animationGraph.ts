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
import {
  AnimationGraph,
  CustomGraph,
  BElement,
  Bone,
  getAnimationGraph,
  IdMap,
  toMap,
  getCustomGraph,
  mergeMap,
} from '../models'
import { dropMap, extractMap, mapReduce, toList } from '../utils/commons'
import { useHistoryStore } from './history'
import { useEntities } from '/@/composables/stores/entities'
import { EditMovement, SelectOptions } from '/@/composables/modes/types'
import { useItemSelectable } from '/@/composables/stores/selectable'
import { HistoryStore } from '/@/composables/stores/history'
import { fromEntityList, toEntityList } from '/@/models/entity'
import {
  EdgeSummary,
  GraphNode,
  GraphNodeBase,
  GraphNodeEdgePositions,
  GraphNodes,
  GraphNodeType,
} from '/@/models/graphNode'
import { NodeModule } from '/@/utils/graphNodes/core'
import {
  cleanAllEdgeGenerics,
  createGraphNode,
  deleteAndDisconnectNodes,
  getGraphNodeModule,
  GetGraphNodeModule,
  resolveAllNodes,
  NODE_MENU_OPTION,
  createGraphNodeIncludeCustom,
  isUniqueEssentialNodeForCustomGraph,
  isExclusiveNodeForCustomGraph,
  getUpdatedNodeMapToChangeNodeStruct,
  isInterfaceChanged,
  getNodeErrors,
  completeNodeMap,
  NODE_MENU_OPTIONS_SRC,
} from '/@/utils/graphNodes'
import { getNotDuplicatedName } from '/@/utils/relations'
import { useStore } from '/@/store'
import { useElementStore } from '/@/store/element'
import { createGraphNodeContext } from '/@/utils/elements'
import { useAnimationStore } from '/@/store/animation'
import { useValueStore } from '/@/composables/stores/valueStore'
import { createCustomNodeModule } from '/@/utils/graphNodes/customGraph'
import { useCanvasStore } from '/@/store/canvas'
import { DraftGraphEdge } from '/@/composables/modeStates/animationGraph/core'
import { add, sub } from 'okageo'
import { getGraphNodeEdgePosition } from '/@/utils/helpers'

export type GraphType = 'graph' | 'custom'

interface StoreContext {
  getArmatureId: () => string | undefined
  getPosedBoneMap: () => IdMap<Bone>
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
  const customGraphEntities = useEntities<CustomGraph>('CustomGraph')

  const graphSelectable = useItemSelectable(
    'Graph',
    () => graphEntities.entities.value.byId
  )
  const nodeSelectable = useItemSelectable('Node', () => nodeMap.value)
  const customGraphSelectable = useItemSelectable(
    'CustomGraph',
    () => customGraphEntities.entities.value.byId
  )
  // Nodes can belong to both AnimationGraph and CustomGraph
  // => Switch the parent dynamically due to this varibale
  const graphTypeStore = useValueStore<GraphType>('Graph Type', () => 'graph')

  historyStore.defineReducers(graphEntities.reducers)
  historyStore.defineReducers(nodeEntities.reducers)
  historyStore.defineReducers(customGraphEntities.reducers)
  historyStore.defineReducers(graphSelectable.reducers)
  historyStore.defineReducers(nodeSelectable.reducers)
  historyStore.defineReducers(customGraphSelectable.reducers)
  historyStore.defineReducers(graphTypeStore.reducers)

  const graphs = computed(() => toEntityList(graphEntities.entities.value))
  const lastSelectedGraphId = graphSelectable.lastSelectedId
  const lastSelectedGraph = computed(() =>
    graphSelectable.lastSelectedId.value
      ? graphEntities.entities.value.byId[graphSelectable.lastSelectedId.value]
      : undefined
  )

  const customGraphs = computed(() =>
    toEntityList(customGraphEntities.entities.value)
  )
  const lastSelectedCustomGraphId = customGraphSelectable.lastSelectedId
  const lastSelectedCustomGraph = computed(() =>
    customGraphSelectable.lastSelectedId.value
      ? customGraphEntities.entities.value.byId[
          customGraphSelectable.lastSelectedId.value
        ]
      : undefined
  )

  const graphType = computed(() => graphTypeStore.state.value)
  function setGraphType(canvasType: GraphType) {
    historyStore.dispatch(graphTypeStore.createUpdateAction(canvasType), [
      nodeSelectable.createClearAllAction(),
    ])
  }
  function getNodeParentEntity() {
    return graphType.value === 'graph' ? graphEntities : customGraphEntities
  }
  function getNodeParentSelectable() {
    return graphType.value === 'graph' ? graphSelectable : customGraphSelectable
  }
  function getNodeParent() {
    const id = getNodeParentSelectable().lastSelectedId.value
    return id ? getNodeParentEntity().entities.value.byId[id] : undefined
  }

  const nodeMap = computed(() => {
    const parent = getNodeParent()
    if (!parent) return {}

    const nodeById = nodeEntities.entities.value.byId
    return toMap(parent.nodes.map((id) => nodeById[id]))
  })
  const selectedNodes = nodeSelectable.selectedMap
  const lastSelectedNodeId = nodeSelectable.lastSelectedId
  const lastSelectedNode = computed(() =>
    lastSelectedNodeId.value
      ? nodeEntities.entities.value.byId[lastSelectedNodeId.value]
      : undefined
  )

  const targetArmatureId = computed(storeContext.getArmatureId)

  const customModules = computed<IdMap<NodeModule<any>>>(() => {
    const nodeMap = nodeEntities.entities.value.byId
    return mapReduce(toMap(customGraphs.value), (customGraph) => {
      return createCustomNodeModule(
        customGraph,
        toMap(customGraph.nodes.map((id) => nodeMap[id]))
      )
    })
  })

  const getGraphNodeModuleFn = computed<() => GetGraphNodeModule>(() => {
    const fn = (type: GraphNodeType) => {
      if (customModules.value[type]) {
        return customModules.value[type]
      } else {
        return getGraphNodeModule(type)
      }
    }
    return () => fn
  })

  const nodeItemList = computed<NODE_MENU_OPTION[]>(() => {
    return graphType.value === 'graph'
      ? NODE_MENU_OPTIONS_SRC.concat([
          {
            label: 'Custom',
            children: customGraphs.value.map((graph) => ({
              label: graph.name,
              type: graph.id,
            })),
          },
        ])
      : NODE_MENU_OPTIONS_SRC.concat([
          {
            label: 'Input/Output',
            children: [
              { type: 'custom_input', label: 'Input' },
              { type: 'custom_output', label: 'Output' },
            ],
          },
        ])
  })

  const nodeErrorMessagesMap = computed<IdMap<string[]>>(() => {
    return getNodeErrors(getGraphNodeModuleFn.value(), nodeMap.value)
  })

  // These nodes are completed invalid input fields as default value
  const completedNodeMap = computed(() => {
    return completeNodeMap(
      getGraphNodeModuleFn.value(),
      nodeMap.value,
      nodeErrorMessagesMap.value
    )
  })

  const resolvedGraph = computed(() => {
    const parent = getNodeParent()
    if (!parent) return

    const armatureId = (parent as AnimationGraph)?.armatureId
    const context = createGraphNodeContext(
      armatureId ? storeContext.getElementMap(armatureId) : {},
      storeContext.getPosedBoneMap(),
      {
        currentFrame: storeContext.getCurrentFrame(),
        endFrame: storeContext.getEndFrame(),
      }
    )
    const resolvedNodeMap = resolveAllNodes(
      getGraphNodeModuleFn.value(),
      context,
      completedNodeMap.value
    )
    return { context, nodeMap: resolvedNodeMap }
  })

  function initState(
    graphs: AnimationGraph[],
    customGraphs: CustomGraph[],
    nodes: GraphNode[],
    graphSelected: [string, true][],
    customGraphSelectad: [string, true][],
    nodeSelected: [string, true][],
    graphType: GraphType
  ) {
    graphEntities.init(fromEntityList(graphs))
    customGraphEntities.init(fromEntityList(customGraphs))
    nodeEntities.init(fromEntityList(nodes))
    graphSelectable.restore(graphSelected)
    customGraphSelectable.restore(customGraphSelectad)
    nodeSelectable.restore(nodeSelected)
    graphTypeStore.restore(graphType)
  }

  function exportState() {
    return {
      graphs: graphs.value,
      customGraphs: customGraphs.value,
      nodes: toEntityList(nodeEntities.entities.value),
      graphSelected: graphSelectable.createSnapshot(),
      customGraphSelected: customGraphSelectable.createSnapshot(),
      nodeSelected: nodeSelectable.createSnapshot(),
      graphType: graphTypeStore.createSnapshot(),
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
      !getNodeParent() ||
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
    if (!getNodeParent()) {
      if (graphType.value === 'graph') {
        addGraph()
      } else {
        addCustomGraph()
      }
    }

    const parent = getNodeParent()
    if (!parent) return

    const node = createGraphNodeIncludeCustom(
      customModules.value,
      type,
      arg,
      !arg.id
    )

    historyStore.dispatch(nodeEntities.createAddAction([node]), [
      getNodeParentEntity().createUpdateAction({
        [parent.id]: {
          nodes: [...parent.nodes, node.id],
        },
      }),
      nodeSelectable.createSelectAction(node.id),
    ])
    return node
  }

  function canAddThisNode(node: Pick<GraphNode, 'type'>): boolean {
    if (graphType.value === 'graph') {
      return !isExclusiveNodeForCustomGraph(node.type)
    } else {
      // TODO: Consider custom graph in other custom graph
      return (
        !!getGraphNodeModule(node.type) &&
        !isUniqueEssentialNodeForCustomGraph(node.type)
      )
    }
  }

  function pasteNodes(nodes: GraphNode[]) {
    const parent = getNodeParent()
    const filteredNodes = nodes.filter((n) => canAddThisNode(n))
    if (!parent || filteredNodes.length === 0) return

    historyStore.dispatch(nodeEntities.createAddAction(filteredNodes), [
      getNodeParentEntity().createUpdateAction({
        [parent.id]: {
          nodes: parent.nodes.concat(filteredNodes.map((n) => n.id)),
        },
      }),
      nodeSelectable.createMultiSelectAction(filteredNodes.map((n) => n.id)),
    ])
  }

  function deleteNodes() {
    const parent = getNodeParent()
    if (!parent) return

    const deletedInfo = deleteAndDisconnectNodes(
      getGraphNodeModuleFn.value(),
      toList(nodeMap.value),
      selectedNodes.value
    )

    const nodeMapByDelete = toMap(deletedInfo.nodes)

    const updatedNodesByDisconnect = extractMap(
      nodeMapByDelete,
      deletedInfo.updatedIds
    )
    const updatedNodesByClean = cleanAllEdgeGenerics(
      getGraphNodeModuleFn.value(),
      {
        ...nodeMapByDelete,
        ...updatedNodesByDisconnect,
      }
    )

    const deletedIds = dropMap(selectedNodes.value, nodeMapByDelete)
    const nextGraphNodeMap = {
      ...updatedNodesByDisconnect,
      ...updatedNodesByClean,
    }

    const execDispatch = (updatedNodeMap: IdMap<GraphNodeBase>) => {
      historyStore.dispatch(
        nodeEntities.createDeleteAction(Object.keys(deletedIds)),
        [
          nodeEntities.createUpdateAction(updatedNodeMap),
          getNodeParentEntity().createUpdateAction({
            [parent.id]: {
              nodes: parent.nodes.filter((id) => !deletedIds[id]),
            },
          }),
          nodeSelectable.createClearAllAction(),
        ]
      )
    }

    if (graphType.value === 'custom' && lastSelectedCustomGraph.value) {
      // Clean custom nodes related to this custom graph
      const nextNodeMap = {
        ...dropMap(nodeMap.value, deletedIds),
        ...nextGraphNodeMap,
      }
      const nextStruct = createCustomNodeModule(
        { ...lastSelectedCustomGraph.value, nodes: Object.keys(nextNodeMap) },
        nextNodeMap
      ).struct

      if (
        isInterfaceChanged(
          customModules.value[lastSelectedCustomGraph.value.id].struct,
          nextStruct
        )
      ) {
        const updatedNodeMap = getUpdatedNodeMapToChangeNodeStruct(
          getGraphNodeModuleFn.value(),
          {
            ...dropMap(nodeEntities.entities.value.byId, deletedIds),
            ...nextNodeMap,
          },
          lastSelectedCustomGraph.value.id,
          nextStruct
        )

        execDispatch(updatedNodeMap)
      } else {
        execDispatch(nextGraphNodeMap)
      }
    } else {
      execDispatch(nextGraphNodeMap)
    }
  }

  /**
   * This method can be used only when the node's interface is never changed
   * e.g. When the field value of data or inputs is changed
   */
  function updateNode(id: string, val: Partial<GraphNode>, seriesKey?: string) {
    const parent = getNodeParent()
    if (!parent) return

    historyStore.dispatch(
      nodeEntities.createUpdateAction({ [id]: val }, seriesKey)
    )
  }

  function updateNodes(val: IdMap<Partial<GraphNode>>) {
    const parent = getNodeParent()
    if (!parent) return

    if (graphType.value === 'custom' && lastSelectedCustomGraph.value) {
      // Clean custom nodes related to this custom graph
      const nextNodeMap = mergeMap(nodeMap.value, val) as IdMap<GraphNode>
      const nextStruct = createCustomNodeModule(
        lastSelectedCustomGraph.value,
        nextNodeMap
      ).struct

      if (
        isInterfaceChanged(
          customModules.value[lastSelectedCustomGraph.value.id].struct,
          nextStruct
        )
      ) {
        const updatedNodeMap = getUpdatedNodeMapToChangeNodeStruct(
          getGraphNodeModuleFn.value(),
          { ...nodeEntities.entities.value.byId, ...nextNodeMap },
          lastSelectedCustomGraph.value.id,
          nextStruct
        )

        historyStore.dispatch(
          nodeEntities.createUpdateAction({
            ...val,
            ...updatedNodeMap,
          })
        )
      } else {
        historyStore.dispatch(nodeEntities.createUpdateAction(val))
      }
    } else {
      historyStore.dispatch(nodeEntities.createUpdateAction(val))
    }
  }

  function selectCustomGraph(id = '') {
    if (!customGraphSelectable.getSelectHistoryDryRun(id)) return

    historyStore.dispatch(customGraphSelectable.createSelectAction(id))
  }

  function addCustomGraph(arg: Partial<{ id: string; name: string }> = {}) {
    const beginInputNode = createGraphNode(
      'custom_begin_input',
      {
        position: { x: -200, y: 0 },
      },
      true
    )
    const beginOutputNode = createGraphNode(
      'custom_begin_output',
      {
        position: { x: 200, y: 0 },
      },
      true
    )
    const customGraph = getCustomGraph(
      {
        id: arg.id,
        name: getNotDuplicatedName(
          arg.name ?? 'Custom',
          customGraphs.value.map((g) => g.name)
        ),
        nodes: [beginInputNode.id, beginOutputNode.id],
      },
      !arg.id
    )

    historyStore.dispatch(customGraphEntities.createAddAction([customGraph]), [
      nodeEntities.createAddAction([beginInputNode, beginOutputNode]),
      customGraphSelectable.createSelectAction(customGraph.id),
    ])
  }

  function deleteCustomGraph() {
    const customGraph = lastSelectedCustomGraph.value
    if (!customGraph) return

    historyStore.dispatch(
      customGraphEntities.createDeleteAction([customGraph.id]),
      [
        nodeEntities.createDeleteAction(customGraph.nodes),
        nodeSelectable.createClearAllAction(),
        customGraphSelectable.createClearAllAction(),
      ]
    )
  }

  function updateCustomGraph(customGraph: Partial<CustomGraph>) {
    if (!lastSelectedCustomGraphId.value) return

    historyStore.dispatch(
      customGraphEntities.createUpdateAction({
        [lastSelectedCustomGraphId.value]: customGraph,
      })
    )
  }

  const editMovement = ref<EditMovement>()
  const draftEdge = ref<DraftGraphEdge>()

  const editedNodeMap = computed(() => {
    if (!editMovement.value) return nodeMap.value

    const translate = sub(editMovement.value.current, editMovement.value.start)
    const selectedMap = selectedNodes.value
    return mapReduce(nodeMap.value, (n, id) => {
      return selectedMap[id]
        ? { ...n, position: add(n.position, translate) }
        : n
    })
  })

  const edgePositionMap = computed<IdMap<GraphNodeEdgePositions>>(() => {
    return mapReduce(editedNodeMap.value, (node) =>
      getGraphNodeEdgePosition(getGraphNodeModuleFn.value(), node)
    )
  })

  const edgeSummaryMap = computed<IdMap<IdMap<EdgeSummary>>>(() => {
    const draftToInfo =
      draftEdge.value?.type === 'draft-output'
        ? {
            id: draftEdge.value.input.nodeId,
            key: draftEdge.value.input.key,
          }
        : undefined

    const allNodes = editedNodeMap.value

    return mapReduce(allNodes, (node) => {
      const inputsPositions = edgePositionMap.value[node.id].inputs
      return Object.entries(node.inputs).reduce<IdMap<EdgeSummary>>(
        (p, [key, input]) => {
          if (
            !input.from ||
            !edgePositionMap.value[input.from.id] ||
            !edgePositionMap.value[input.from.id].outputs[input.from.key]
          )
            return p

          if (
            draftToInfo &&
            draftToInfo.id === node.id &&
            draftToInfo.key === key
          )
            return p

          p[key] = {
            from: add(
              allNodes[input.from.id].position,
              edgePositionMap.value[input.from.id].outputs[input.from.key].p
            ),
            to: add(node.position, inputsPositions[key].p),
            inputId: node.id,
            inputKey: key,
            outputId: input.from.id,
            outputKey: input.from.key,
          }
          return p
        },
        {}
      )
    })
  })

  return {
    initState,
    exportState,

    graphType,
    setGraphType,
    parentGraphs: computed(() =>
      toEntityList(getNodeParentEntity().entities.value)
    ),
    parentGraph: computed(getNodeParent),

    graphs,
    lastSelectedGraph,

    customGraphs,
    lastSelectedCustomGraph,

    nodeMap,
    lastSelectedNode,
    selectedNodes,
    targetArmatureId,
    getGraphNodeModuleFn,
    nodeItemList,
    nodeErrorMessagesMap,
    completedNodeMap,
    resolvedGraph,

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

    selectCustomGraph,
    addCustomGraph,
    deleteCustomGraph,
    updateCustomGraph,

    editMovement: computed(() => editMovement.value),
    setEditMovement: (val?: EditMovement) => {
      editMovement.value = val
    },
    draftEdge: computed(() => draftEdge.value),
    setDraftEdge: (val?: DraftGraphEdge) => {
      draftEdge.value = val
    },

    editedNodeMap,
    edgePositionMap,
    edgeSummaryMap,
  }
}
export type AnimationGraphStore = ReturnType<typeof createStore>

const store = createStore(useHistoryStore(), {
  getArmatureId: () => useStore().lastSelectedArmatureId.value,
  getPosedBoneMap: () => useCanvasStore().posedBoneMap.value,
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
