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

import { reactive, computed } from 'vue'
import { add, isSame, IVec2, sub } from 'okageo'
import { Transform, getTransform, IdMap, toMap } from '/@/models/index'
import type { EditMovement } from '/@/composables/modes/types'
import { gridRound } from '/@/utils/geometry'
import { AnimationGraphStore } from '/@/store/animationGraph'
import {
  GraphEdgeConnection,
  GraphNode,
  GraphNodeInput,
  GRAPH_VALUE_TYPE_KEY,
} from '/@/models/graphNode'
import {
  cleanEdgeGenericsGroupAt,
  duplicateNodes,
  getUpdatedNodeMapToDisconnectNodeInput,
  getOutputType,
  updateInputConnection,
  isolateNodes,
} from '/@/utils/graphNodes'
import { mapFilter, mapReduce, toList } from '/@/utils/commons'
import { generateUuid } from '/@/utils/random'
import {
  StringItem,
  useClipboard,
  useClipboardSerializer,
} from '/@/composables/clipboard'

export type EditMode = '' | 'grab' | 'add' | 'drag-node' | 'drag-edge'

export type DraftGraphEdge =
  | {
      type: 'draft-to'
      from: GraphEdgeConnection
      to: IVec2
    }
  | {
      type: 'draft-from'
      from: IVec2
      to: GraphEdgeConnection
    }

export interface ClosestEdgeInfo {
  nodeId: string
  type: 'input' | 'output'
  key: string
}

interface EdgeInfo {
  nodeId: string
  type: 'input' | 'output'
  key: string
}

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
  keyDownPosition: IVec2
  dragTarget:
    | { type: 'node'; id: string }
    | { type: 'edge'; draftGraphEdge: DraftGraphEdge }
    | undefined
  closestEdgeInfo: EdgeInfo | undefined
  nodeSuggestion: GRAPH_VALUE_TYPE_KEY | undefined
}

export function useAnimationGraphMode(graphStore: AnimationGraphStore) {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
    keyDownPosition: { x: 0, y: 0 },
    dragTarget: undefined,
    closestEdgeInfo: undefined,
    nodeSuggestion: undefined,
  })
  const selectedNodes = computed(() => graphStore.selectedNodes.value)
  const lastSelectedNodeId = computed(
    () => graphStore.lastSelectedNode.value?.id
  )
  const target = computed(() => graphStore.parentGraph.value)
  const isAnySelected = computed(() => !!lastSelectedNodeId.value)

  const selectedNodeMap = computed(() =>
    mapReduce(selectedNodes.value, (_, id) => graphStore.nodeMap.value[id])
  )

  const clipboardSerializer = useClipboardSerializer<
    'graph-nodes',
    IdMap<GraphNode>
  >('graph-nodes')

  const clipboard = useClipboard(
    () => {
      return {
        'text/plain': clipboardSerializer.serialize(
          toMap(
            isolateNodes(
              graphStore.getGraphNodeModuleFn.value(),
              toList(selectedNodeMap.value)
            ).nodes
          )
        ),
      }
    },
    async (items) => {
      const item = items.find((i) => i.kind === 'string') as
        | StringItem
        | undefined
      if (!item) return

      const text: any = await item.getAsString()
      const availableNodes = mapFilter(
        clipboardSerializer.deserialize(text),
        (n) => !!graphStore.getGraphNodeModuleFn.value()(n.type)
      )

      graphStore.pasteNodes(
        toList(
          duplicateNodes(
            graphStore.getGraphNodeModuleFn.value(),
            availableNodes,
            graphStore.nodeMap.value,
            () => generateUuid()
          )
        ).map((n) => ({
          ...n,
          position: add(n.position, { x: 20, y: 20 }),
        }))
      )
    }
  )

  function cancel() {
    state.command = ''
    state.editMovement = undefined
    state.dragTarget = undefined
    state.closestEdgeInfo = undefined
    state.nodeSuggestion = undefined
  }

  function clickAny() {
    if (state.command && !state.dragTarget) {
      completeEdit()
    }
  }

  function clickEmpty() {
    if (state.command) {
      completeEdit()
    } else {
      graphStore.selectNode()
    }
  }

  function updateNodeInput(
    node: GraphNode,
    inputKey: string,
    targetId: string,
    targetKey: string
  ) {
    const updated = updateInputConnection(
      { node: graphStore.nodeMap.value[targetId], key: targetKey },
      { node, key: inputKey }
    )
    if (!updated) return

    graphStore.updateNodes({
      [updated.id]: updated,
      ...cleanEdgeGenericsGroupAt(
        graphStore.getGraphNodeModuleFn.value(),
        { ...graphStore.nodeMap.value, [updated.id]: updated },
        { id: updated.id, key: inputKey }
      ),
    })
  }

  function disconnectNodeInput(nodeId: string, inputKey: string) {
    graphStore.updateNodes(
      getUpdatedNodeMapToDisconnectNodeInput(
        graphStore.getGraphNodeModuleFn.value(),
        graphStore.nodeMap.value,
        nodeId,
        inputKey
      )
    )
  }

  function upLeft(options?: { empty: boolean }) {
    if (state.command === 'drag-edge' && state.dragTarget?.type === 'edge') {
      if (state.closestEdgeInfo && isValidDraftConnection.value) {
        if (state.dragTarget.draftGraphEdge.type === 'draft-to') {
          const from = state.dragTarget.draftGraphEdge.from
          const toNode = graphStore.nodeMap.value[state.closestEdgeInfo.nodeId]
          updateNodeInput(
            toNode,
            state.closestEdgeInfo.key,
            from.nodeId,
            from.key
          )
        } else {
          const to = state.dragTarget.draftGraphEdge.to
          const toNode = graphStore.nodeMap.value[to.nodeId]
          updateNodeInput(
            toNode,
            to.key,
            state.closestEdgeInfo.nodeId,
            state.closestEdgeInfo.key
          )
        }
        cancel()
      } else {
        if (state.dragTarget.draftGraphEdge.type === 'draft-from') {
          const to = state.dragTarget.draftGraphEdge.to
          const toNode = graphStore.nodeMap.value[to.nodeId]
          const toKey = to.key
          const input = (toNode.inputs as any)[toKey] as GraphNodeInput<unknown>
          if (input.from) {
            // delete current edge
            disconnectNodeInput(to.nodeId, toKey)
          }
          cancel()
        } else {
          if (options?.empty) {
            // save the edge type and suggest relational nodes
            const from = state.dragTarget.draftGraphEdge.from
            const node = graphStore.nodeMap.value[from.nodeId]
            state.nodeSuggestion = getOutputType(
              graphStore.getGraphNodeModuleFn.value()(node.type)?.struct,
              node,
              from.key
            ).type
            state.keyDownPosition = state.editMovement!.current
            state.command = 'add'
          } else {
            cancel()
          }
        }
      }
    } else if (state.command) {
      completeEdit()
    }
  }

  function setEditMode(mode: EditMode) {
    if (!target.value) return
    cancel()
    if (!isAnySelected.value) return

    switch (mode) {
      default:
        state.command = mode
    }
  }

  const editTransforms = computed<IdMap<Transform>>(() => {
    const editMovement = state.editMovement
    if (!editMovement) return {}
    if (state.dragTarget?.type === 'edge') return {}

    const translate = getGridRoundedPoint(
      sub(editMovement.current, editMovement.start)
    )

    // Adjust dragged target position along the grid
    const adjustedTranslate = state.dragTarget
      ? add(
          translate,
          getGridRoundedDiff(
            selectedNodeMap.value[state.dragTarget.id].position
          )
        )
      : translate

    const transform = getTransform({ translate: adjustedTranslate })
    return mapReduce(selectedNodes.value, () => transform)
  })

  const editedNodeMap = computed<IdMap<GraphNode>>(() => {
    if (!target.value) return {}
    return Object.keys(editTransforms.value).reduce<IdMap<GraphNode>>(
      (m, id) => {
        const src = graphStore.nodeMap.value[id]
        m[id] = {
          ...src,
          position: add(src.position, editTransforms.value[id].translate),
        }
        return m
      },
      {}
    )
  })

  function completeEdit() {
    if (!target.value) return

    if (
      state.editMovement &&
      !isSame(state.editMovement.start, state.editMovement.current)
    ) {
      graphStore.updateNodes(editedNodeMap.value)
    }
    state.editMovement = undefined
    state.command = ''
    state.dragTarget = undefined
    state.closestEdgeInfo = undefined
  }

  return {
    onCopy: clipboard.onCopy,
    onPaste: clipboard.onPaste,

    command: computed(() => state.command),
    keyDownPosition: computed(() => state.keyDownPosition),

    getEditTransforms(id: string) {
      return editTransforms.value[id] || getTransform()
    },
    end: () => cancel(),
    cancel,
    setEditMode,

    clickAny,
    clickEmpty,
    upLeft,
  }
}
export type AnimationGraphMode = ReturnType<typeof useAnimationGraphMode>

function getGridRoundedPoint(p: IVec2): IVec2 {
  return {
    x: gridRound(10, p.x),
    y: gridRound(10, p.y),
  }
}

function getGridRoundedDiff(p: IVec2): IVec2 {
  return sub(getGridRoundedPoint(p), p)
}
