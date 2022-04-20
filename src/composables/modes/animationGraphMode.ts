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
import { AnimationGraphStateContext } from '/@/composables/modeStates/animationGraph/core'
import { AnimationGraphStore } from '/@/store/animationGraph'
import { mapReduce } from '/@/utils/commons'

export function useAnimationGraphMode(options: {
  graphStore: AnimationGraphStore
  requestPointerLock: () => void
  exitPointerLock: () => void
  startEditMovement: () => void
}) {
  const graphStore = options.graphStore

  const context: AnimationGraphStateContext = {
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
    selectedNodes: graphStore.selectNodes,
    selectAllNode: graphStore.selectAllNode,
    deleteNodes: graphStore.deleteNodes,
    addNode: graphStore.addNode,
    getEditMovement: () => graphStore.editMovement.value,
    setEditMovement: graphStore.setEditMovement,
    startEditMovement: options.startEditMovement,
    getDraftEdge: () => graphStore.draftEdge.value,
    setDraftEdge: graphStore.setDraftEdge,

    setPopupMenuList: () => {},
    getNodeItemList: () => [],
  }
  const sm = useModeStateMachine(() => context, useDefaultState)
  return { sm }
}
export type AnimationGraphMode = ReturnType<typeof useAnimationGraphMode>
