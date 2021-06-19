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
import { add, IRectangle, IVec2, sub } from 'okageo'
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
import { GraphNode, GraphNodeType } from '/@/models/graphNode'

export type EditMode = '' | 'grab' | 'add' | 'delete' | 'drag-node'

interface State {
  command: EditMode
  editMovement: EditMovement | undefined
  keyDownPosition: IVec2
  dragTarget: { type: 'node' | 'edge'; id: string } | undefined
}

const notNeedLock = { needLock: false }

export function useAnimationGraphMode(graphStore: AnimationGraphStore) {
  const state = reactive<State>({
    command: '',
    editMovement: undefined,
    keyDownPosition: { x: 0, y: 0 },
    dragTarget: undefined,
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
  }

  function clickAny() {
    if (state.command) {
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

  function upLeft() {
    if (state.command) {
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

    if (state.dragTarget?.type === 'node') {
      return {
        [state.dragTarget.id]: transform,
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

    graphStore.updateNodes(editedNodeMap.value)
    state.editMovement = undefined
    state.command = ''
    state.dragTarget = undefined
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
    if (state.dragTarget?.type === 'node') {
      state.editMovement = arg
    }
  }

  function execDelete() {
    if (state.command) {
      cancel()
    }
    // TODO
    // graphStore.deleteNode()
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
  ])

  const deleteMenuList = useMenuList(() => [
    { label: 'Delete', exec: execDelete },
  ])

  const popupMenuList = computed<PopupMenuItem[]>(() => {
    switch (state.command) {
      case 'add':
        return addMenuList.list.value
      case 'delete':
        return deleteMenuList.list.value
      default:
        return []
    }
  })

  function downNodeBody(id: string) {
    select(id)
    state.dragTarget = { type: 'node', id }
    state.command = 'drag-node'
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
