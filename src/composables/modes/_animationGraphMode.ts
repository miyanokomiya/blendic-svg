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

import { reactive, computed, watch } from 'vue'
import { add, IRectangle, isSame, IVec2, sub } from 'okageo'
import { Transform, getTransform, IdMap, toMap } from '/@/models/index'
import type {
  EditMovement,
  PopupMenuItem,
  SelectOptions,
  CommandExam,
} from '/@/composables/modes/types'
import { getIsRectHitRectFn, gridRound } from '/@/utils/geometry'
import { useMenuList } from '/@/composables/menuList'
import { AnimationGraphStore } from '/@/store/animationGraph'
import {
  GraphEdgeConnection,
  GraphNode,
  GraphNodeType,
  GraphNodeInput,
  GRAPH_VALUE_TYPE_KEY,
} from '/@/models/graphNode'
import {
  cleanEdgeGenericsGroupAt,
  duplicateNodes,
  getUpdatedNodeMapToDisconnectNodeInput,
  getOutputType,
  NODE_MENU_OPTIONS_SRC,
  updateInputConnection,
  validateConnection,
  isolateNodes,
} from '/@/utils/graphNodes'
import { mapFilter, mapReduce, toList } from '/@/utils/commons'
import { getGraphNodeRect } from '/@/utils/helpers'
import { getCtrlOrMetaStr } from '/@/utils/devices'
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

const notNeedLock = { needLock: false }
const needLock = { needLock: true }

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

  const getGraphNodeModule = computed(() =>
    graphStore.getGraphNodeModuleFn.value()
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

  const isValidDraftConnection = computed(() => {
    if (
      state.command === 'drag-edge' &&
      state.dragTarget?.type === 'edge' &&
      state.closestEdgeInfo
    ) {
      if (state.dragTarget.draftGraphEdge.type === 'draft-to') {
        if (state.closestEdgeInfo.type === 'output') return false

        const from = state.dragTarget.draftGraphEdge.from
        const fromNode = graphStore.nodeMap.value[from.nodeId]
        const fromKey = from.key

        const toNode = graphStore.nodeMap.value[state.closestEdgeInfo.nodeId]
        const toKey = state.closestEdgeInfo.key
        return validateConnection(
          graphStore.getGraphNodeModuleFn.value(),
          { node: fromNode, key: fromKey },
          { node: toNode, key: toKey }
        )
      } else {
        if (state.closestEdgeInfo.type === 'input') return false

        const fromNode = graphStore.nodeMap.value[state.closestEdgeInfo.nodeId]
        const fromKey = state.closestEdgeInfo.key

        const to = state.dragTarget.draftGraphEdge.to
        const toNode = graphStore.nodeMap.value[to.nodeId]
        const toKey = to.key
        return validateConnection(
          graphStore.getGraphNodeModuleFn.value(),
          { node: fromNode, key: fromKey },
          { node: toNode, key: toKey }
        )
      }
    }

    return false
  })

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

  const draftEdgeInfo = computed<DraftGraphEdge | undefined>(() => {
    if (!state.editMovement || state.dragTarget?.type !== 'edge')
      return undefined
    return state.dragTarget.draftGraphEdge.type === 'draft-to'
      ? {
          ...state.dragTarget.draftGraphEdge,
          to: state.editMovement.current,
        }
      : {
          ...state.dragTarget.draftGraphEdge,
          from: state.editMovement.current,
        }
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

  function select(id: string, options?: SelectOptions) {
    if (state.command) {
      completeEdit()
      return
    }

    graphStore.selectNode(id, options)
  }

  function rectSelect(rect: IRectangle, options?: SelectOptions) {
    const checkFn = getIsRectHitRectFn(rect)
    graphStore.selectNodes(
      mapReduce(
        mapFilter(graphStore.nodeMap.value, (node) =>
          checkFn(getGraphNodeRect(getGraphNodeModule.value, node))
        ),
        () => true
      ),
      options
    )
  }

  function selectAll() {
    if (state.command) {
      cancel()
      return
    }
    graphStore.selectAllNode()
  }

  function execKey(arg: {
    key: string
    position: IVec2
    shift?: boolean
    ctrl?: boolean
  }): {
    needLock: boolean
  } {
    if (!target.value) {
      if (graphStore.targetArmatureId.value) {
        switch (arg.key) {
          case 'A':
            cancel()
            state.keyDownPosition = arg.position
            state.command = 'add'
            return notNeedLock
          default:
            return notNeedLock
        }
      } else {
        return notNeedLock
      }
    }

    switch (arg.key) {
      case 'Escape':
        cancel()
        return notNeedLock
      case 'A':
        cancel()
        state.keyDownPosition = arg.position
        state.command = 'add'
        return notNeedLock
      case 'a':
        cancel()
        selectAll()
        return notNeedLock
      case 'x':
        cancel()
        execDelete()
        return notNeedLock
      case 'g':
        cancel()
        state.keyDownPosition = arg.position
        state.command = 'grab'
        return needLock
      case 'D':
        if (duplicate()) {
          return needLock
        } else {
          return notNeedLock
        }
      case 'c':
      case 'v':
        if (arg.ctrl) {
          cancel()
        }
        return notNeedLock
      default:
        return notNeedLock
    }
  }

  function mousemove(arg: EditMovement) {
    if (state.command) {
      state.editMovement = arg
    }
  }

  function drag(arg: EditMovement) {
    if (state.dragTarget) {
      state.editMovement = arg
    }
  }

  function execDelete() {
    if (state.command) {
      cancel()
    }
    graphStore.deleteNodes()
  }

  function execAddNode(type: GraphNodeType, position: IVec2) {
    if (state.command && state.command !== 'add') {
      cancel()
      return
    }
    graphStore.addNode(type, { position: getGridRoundedPoint(position) })
    cancel()
  }

  function duplicate(): boolean {
    if (state.command) {
      cancel()
      return false
    }

    graphStore.pasteNodes(
      toList(
        duplicateNodes(
          graphStore.getGraphNodeModuleFn.value(),
          selectedNodeMap.value,
          graphStore.nodeMap.value,
          () => generateUuid()
        )
      ).map((n) => ({
        ...n,
        position: add(n.position, { x: 20, y: 20 }),
      }))
    )
    setEditMode('grab')
    return true
  }

  const commands: { [key: string]: CommandExam } = {
    add: { command: 'A', title: 'Add' },
    selectAll: { command: 'a', title: 'All Select' },
    delete: { command: 'x', title: 'Delete' },
    grab: { command: 'g', title: 'Grab' },
    duplicate: { command: 'D', title: 'Duplicate' },
    clip: { command: `${getCtrlOrMetaStr()} + c`, title: 'Clip' },
    paste: { command: `${getCtrlOrMetaStr()} + v`, title: 'Paste' },
  }

  const availableCommandList = computed<CommandExam[]>(() => {
    if (!target.value) {
      if (graphStore.targetArmatureId.value) {
        return [commands.add]
      } else {
        return [{ title: 'Armature Not Selected' }]
      }
    } else if (isAnySelected.value) {
      return [
        commands.add,
        commands.selectAll,
        commands.delete,
        commands.grab,
        commands.duplicate,
        commands.clip,
        commands.paste,
      ]
    } else {
      return [commands.add, commands.selectAll, commands.paste]
    }
  })

  const addMenuList = useMenuList(() =>
    NODE_MENU_OPTIONS_SRC.concat(
      graphStore.customGraphNodeMenuOptionsSrc.value
    ).map(({ label, children }) => ({
      label,
      children: children.map(({ label, type }) => ({
        label,
        exec: () => execAddNode(type, state.keyDownPosition),
      })),
    }))
  )
  watch(() => state.command, addMenuList.clearOpened)

  const popupToAddMenuList = computed<PopupMenuItem[]>(() => {
    return addMenuList.list.value
  })

  const popupMenuList = computed<PopupMenuItem[]>(() => {
    switch (state.command) {
      case 'add':
        return popupToAddMenuList.value
      default:
        return []
    }
  })

  function downNodeBody(id: string, options?: SelectOptions) {
    // select the target if it has not been selected yet
    if (!selectedNodes.value[id]) {
      select(id, options)
    }
    state.dragTarget = { type: 'node', id }
    state.command = 'drag-node'
  }

  function downNodeEdge(draftGraphEdge: DraftGraphEdge) {
    state.dragTarget = { type: 'edge', draftGraphEdge }
    state.command = 'drag-edge'
  }

  function upNodeEdge(closestEdgeInfo: ClosestEdgeInfo) {
    if (state.command === 'drag-edge') {
      state.closestEdgeInfo = closestEdgeInfo
    }
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
    select,
    rectSelect,

    downNodeBody,
    downNodeEdge,
    upNodeEdge,
    draftEdgeInfo,

    execKey,
    mousemove,
    drag,
    clickAny,
    clickEmpty,
    upLeft,

    execDelete,
    execAddNode,
    insert: () => {},
    availableCommandList,
    popupMenuList,
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
