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

import { useModeStateMachine } from '/@/composables/modeStates/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import {
  AnimationGraphStateContext,
  EdgeCutter,
} from '/@/composables/modeStates/animationGraph/core'
import { AnimationGraphStore } from '/@/store/animationGraph'
import { mapReduce } from '/@/utils/commons'
import {
  CommandExam,
  EditMovement,
  PopupMenuItem,
} from '/@/composables/modes/types'
import { Rectangle } from 'okanvas'
import { IVec2 } from 'okageo'
import { NODE_MENU_OPTION } from '/@/utils/graphNodes'
import { generateUuid } from '/@/utils/random'

export function useAnimationGraphMode(options: {
  graphStore: AnimationGraphStore
  requestPointerLock: () => void
  exitPointerLock: () => void

  startEditMovement: () => void
  startDragging: () => void
  getCursorPoint: () => IVec2

  setViewport: (rect?: Rectangle) => void
  panView: (val: EditMovement) => void
  setRectangleDragging: (val?: boolean) => void
  getDraggedRectangle: () => Rectangle | undefined

  setPopupMenuList: (val?: { items: PopupMenuItem[]; point: IVec2 }) => void
  getNodeItemList: () => NODE_MENU_OPTION[]
  setCommandExams: (exams?: CommandExam[]) => void

  setEdgeCutter: (val: EdgeCutter | undefined) => void
  getEdgeCutter: () => EdgeCutter | undefined
}) {
  const graphStore = options.graphStore

  const ctx: AnimationGraphStateContext = {
    generateUuid: generateUuid,
    requestPointerLock: options.requestPointerLock,
    exitPointerLock: options.exitPointerLock,
    getTimestamp: () => Date.now(),
    getGraphNodeModule: (type) => graphStore.getGraphNodeModuleFn.value()(type),
    getNodeMap: () => graphStore.nodeMap.value,
    updateNodes: graphStore.updateNodes,
    getSelectedNodeMap: () =>
      mapReduce(
        graphStore.selectedNodes.value,
        (_, id) => graphStore.nodeMap.value[id]
      ),
    getLastSelectedNodeId: () => graphStore.lastSelectedNode.value?.id,
    selectNodes: graphStore.selectNodes,
    selectAllNode: graphStore.selectAllNode,
    deleteNodes: graphStore.deleteNodes,
    addNode: graphStore.addNode,
    pasteNodes: graphStore.pasteNodes,
    getEditMovement: () => graphStore.editMovement.value,
    setEditMovement: graphStore.setEditMovement,
    getDraftEdge: () => graphStore.draftEdge.value,
    setDraftEdge: graphStore.setDraftEdge,

    startEditMovement: options.startEditMovement,
    startDragging: options.startDragging,
    getCursorPoint: options.getCursorPoint,

    setPopupMenuList: options.setPopupMenuList,
    getNodeItemList: options.getNodeItemList,

    setViewport: options.setViewport,
    panView: options.panView,
    setRectangleDragging: options.setRectangleDragging,
    getDraggedRectangle: options.getDraggedRectangle,

    setCommandExams: options.setCommandExams,

    setEdgeCutter: options.setEdgeCutter,
    getEdgeCutter: options.getEdgeCutter,
    getEdgeSummaryMap: () => graphStore.edgeSummaryMap.value,
  }
  const sm = useModeStateMachine(ctx, useDefaultState)
  return { sm }
}
export type AnimationGraphMode = ReturnType<typeof useAnimationGraphMode>
