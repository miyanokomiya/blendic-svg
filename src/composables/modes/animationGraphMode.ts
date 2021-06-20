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
import { add, IRectangle, isSame, IVec2, sub } from 'okageo'
import { Transform, getTransform, IdMap } from '/@/models/index'
import type {
  EditMovement,
  PopupMenuItem,
  SelectOptions,
} from '/@/composables/modes/types'
import { snapGrid } from '/@/utils/geometry'
import { getCtrlOrMetaStr } from '/@/utils/devices'
import { useMenuList } from '/@/composables/menuList'
import { AnimationGraphStore } from '/@/store/animationGraph'
import {
  GraphEdgeConnection,
  GraphNode,
  GraphNodeType,
  GraphNodeInput,
} from '/@/models/graphNode'
import { validateConnection } from '/@/utils/graphNodes'

export type EditMode = '' | 'grab' | 'add' | 'drag-node' | 'drag-edge'

type DraftGraphEdge =
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
}

const notNeedLock = { needLock: false }

export function useAnimationGraphMode(graphStore: AnimationGraphStore) {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
    keyDownPosition: { x: 0, y: 0 },
    dragTarget: undefined,
    closestEdgeInfo: undefined,
  })
  const selectedNodes = computed(() => graphStore.selectedNodes)
  const lastSelectedNodeId = computed(
    () => graphStore.lastSelectedNode.value?.id
  )
  const target = computed(() => graphStore.lastSelectedGraph.value)
  const isAnySelected = computed(() => !!lastSelectedNodeId.value)

  function cancel() {
    state.command = ''
    state.editMovement = undefined
    state.dragTarget = undefined
    state.closestEdgeInfo = undefined
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
          { type: fromNode.type, key: fromKey },
          { type: toNode.type, key: toKey }
        )
      } else {
        if (state.closestEdgeInfo.type === 'input') return false

        const fromNode = graphStore.nodeMap.value[state.closestEdgeInfo.nodeId]
        const fromKey = state.closestEdgeInfo.key

        const to = state.dragTarget.draftGraphEdge.to
        const toNode = graphStore.nodeMap.value[to.nodeId]
        const toKey = to.key
        return validateConnection(
          { type: fromNode.type, key: fromKey },
          { type: toNode.type, key: toKey }
        )
      }
    }

    return false
  })

  function upLeft() {
    if (state.command === 'drag-edge' && state.dragTarget?.type === 'edge') {
      if (state.closestEdgeInfo && isValidDraftConnection.value) {
        if (state.dragTarget.draftGraphEdge.type === 'draft-to') {
          const from = state.dragTarget.draftGraphEdge.from
          const fromNode = graphStore.nodeMap.value[from.nodeId]
          const fromKey = from.key

          const toNode = graphStore.nodeMap.value[state.closestEdgeInfo.nodeId]
          const toKey = state.closestEdgeInfo.key

          graphStore.updateNode(toNode.id, {
            ...toNode,
            inputs: {
              ...toNode.inputs,
              [toKey]: { from: { id: fromNode.id, key: fromKey } },
            } as any,
          })
        } else {
          const to = state.dragTarget.draftGraphEdge.to
          const toNode = graphStore.nodeMap.value[to.nodeId]
          const toKey = to.key

          const fromNode =
            graphStore.nodeMap.value[state.closestEdgeInfo.nodeId]
          const fromKey = state.closestEdgeInfo.key

          graphStore.updateNode(toNode.id, {
            ...toNode,
            inputs: {
              ...toNode.inputs,
              [toKey]: { from: { id: fromNode.id, key: fromKey } },
            } as any,
          })
        }
      } else {
        if (state.dragTarget.draftGraphEdge.type === 'draft-from') {
          const to = state.dragTarget.draftGraphEdge.to
          const toNode = graphStore.nodeMap.value[to.nodeId]
          const toKey = to.key
          const input = (toNode.inputs as any)[toKey] as GraphNodeInput<unknown>
          if (input.from) {
            // delete current edge
            graphStore.updateNode(toNode.id, {
              ...toNode,
              inputs: {
                ...toNode.inputs,
                [toKey]: { ...input, from: undefined },
              } as any,
            })
          }
        }
      }
      completeEdit()
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

  const editTransforms = computed(() => {
    const editMovement = state.editMovement
    if (!editMovement) return {}

    const translate = sub(editMovement.current, editMovement.start)
    const gridTranslate = editMovement.ctrl
      ? snapGrid(editMovement.scale, translate)
      : translate
    const transform = getTransform({ translate: gridTranslate })

    if (state.dragTarget) {
      if (state.dragTarget.type === 'node') {
        return {
          [state.dragTarget.id]: transform,
        }
      } else {
        return {}
      }
    } else {
      return Object.keys(selectedNodes.value).reduce<IdMap<Transform>>(
        (map, id) => {
          map[id] = transform
          return map
        },
        {}
      )
    }
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

  function rectSelect(_rect: IRectangle, _options?: SelectOptions) {
    // TODO
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
    switch (arg.key) {
      case 'Escape':
        cancel()
        return notNeedLock
      case 'A':
        cancel()
        state.keyDownPosition = arg.position
        state.command = 'add'
        return notNeedLock
      case 'x':
        cancel()
        execDelete()
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
    graphStore.addNode(type, { position })
    cancel()
  }

  function duplicate(): boolean {
    if (state.command) {
      cancel()
      return false
    }

    // TODO
    // const srcNodes = graphStore.allSelectedNodes.value
    // const duplicated = duplicateNodes(srcNodes, names)
    // if (duplicated.length === 0) return false

    // graphStore.addNodes(duplicated, {
    //   head: true,
    //   tail: true,
    // })
    // setEditMode('grab')
    return true
  }

  const availableCommandList = computed(() => {
    const ctrl = { command: getCtrlOrMetaStr(), title: 'Snap' }
    const selects = [
      { command: 'a', title: 'All Select' },
      { command: 'A', title: 'Add' },
    ]

    if (state.command === 'grab') {
      return [
        { command: 'x', title: 'On Axis X' },
        { command: 'y', title: 'On Axis Y' },
        ctrl,
      ]
    } else if (isAnySelected.value) {
      return [
        { command: 'g', title: 'Grab' },
        ...selects,
        { command: 'x', title: 'Delete' },
        { command: 'D', title: 'Duplicate' },
      ]
    } else {
      return [...selects]
    }
  })

  const addMenuList = useMenuList(() => [
    {
      label: 'Number',
      exec: () => execAddNode('scaler', state.keyDownPosition),
    },
    {
      label: 'Make Vector2',
      exec: () => execAddNode('make_vector2', state.keyDownPosition),
    },
    {
      label: 'Break Vector2',
      exec: () => execAddNode('break_vector2', state.keyDownPosition),
    },
    {
      label: 'Make Transform',
      exec: () => execAddNode('make_transform', state.keyDownPosition),
    },
    {
      label: 'Set Transform',
      exec: () => execAddNode('set_transform', state.keyDownPosition),
    },
    {
      label: 'Get Frame',
      exec: () => execAddNode('get_frame', state.keyDownPosition),
    },
    {
      label: 'Get Object',
      exec: () => execAddNode('get_object', state.keyDownPosition),
    },
  ])

  const popupMenuList = computed<PopupMenuItem[]>(() => {
    switch (state.command) {
      case 'add':
        return addMenuList.list.value
      default:
        return []
    }
  })

  function downNodeBody(id: string) {
    select(id)
    state.dragTarget = { type: 'node', id }
    state.command = 'drag-node'
  }

  function downNodeEdge(draftGraphEdge: DraftGraphEdge) {
    state.dragTarget = { type: 'edge', draftGraphEdge }
    state.command = 'drag-edge'
  }

  function upNodeEdge(closestEdgeInfo: {
    nodeId: string
    type: 'input' | 'output'
    key: string
  }) {
    if (state.command === 'drag-edge') {
      state.closestEdgeInfo = closestEdgeInfo
    }
  }

  return {
    command: computed(() => state.command),
    keyDownPosition: computed(() => state.keyDownPosition),

    getEditTransforms(id: string) {
      return editTransforms.value[id] || getTransform()
    },
    end: () => cancel(),
    cancel,
    setEditMode,
    select,
    selectAll,
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
    clip: () => {},
    paste: () => {},
    duplicate,
    availableCommandList,
    popupMenuList,
  }
}
export type AnimationGraphMode = ReturnType<typeof useAnimationGraphMode>
