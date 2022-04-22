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

Copyright (C) 2022, Tomoya Komiyama.
*/

import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useMovingNodeState } from '/@/composables/modeStates/animationGraph/movingNodeState'
import { useGrabbingNodeState } from '/@/composables/modeStates/animationGraph/grabbingNodeState'
import { useAddingNewNodeState } from '/@/composables/modeStates/animationGraph/addingNewNodeState'
import { usePanningState } from '/@/composables/modeStates/animationGraph/panningState'
import { useRectangleSelectingState } from '/@/composables/modeStates/animationGraph/rectangleSelectingState'
import { useConnectingInputEdgeState } from '/@/composables/modeStates/animationGraph/connectingInputEdgeState'
import { parseEdgeInfo } from '/@/composables/modeStates/animationGraph/utils'

export function useDefaultState(): AnimationGraphState {
  return {
    getLabel: () => 'DefaultState',
    onStart: () => Promise.resolve(),
    onEnd: () => Promise.resolve(),
    handleEvent: async (getCtx, event) => {
      const ctx = getCtx()

      switch (event.type) {
        case 'pointerdown':
          switch (event.data.options.button) {
            case 0:
              switch (event.target.type) {
                case 'empty': {
                  ctx.selectNodes({}, event.data.options)
                  return useRectangleSelectingState
                }
                case 'node-body': {
                  const nodeId = event.target.data?.['node_id']
                  if (nodeId) {
                    ctx.selectNodes({ [nodeId]: true }, event.data.options)
                    return () => useMovingNodeState({ nodeId })
                  }
                  return
                }
                case 'node-edge-input': {
                  const edgeInfo = parseEdgeInfo(event.target)
                  return () =>
                    useConnectingInputEdgeState({
                      nodeId: edgeInfo.id,
                      inputKey: edgeInfo.key,
                      point: event.data.point,
                    })
                }
              }
              return
            case 1:
              return usePanningState
          }
          return
        case 'keydown':
          switch (event.data.key) {
            case 'A': {
              const point = event.point
              return point ? () => useAddingNewNodeState({ point }) : undefined
            }
            case 'a':
              ctx.selectAllNode()
              return
            case 'g':
              return ctx.getLastSelectedNodeId()
                ? useGrabbingNodeState
                : undefined
          }
          return
      }
    },
  }
}
