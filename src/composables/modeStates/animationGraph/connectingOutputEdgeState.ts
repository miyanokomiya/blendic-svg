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

import { IVec2 } from 'okageo'
import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import {
  parseEdgeInfo,
  updateNodeInput,
} from '/@/composables/modeStates/animationGraph/utils'
import { useAddingNewNodeState } from '/@/composables/modeStates/animationGraph/addingNewNodeState'
import { usePanningState } from '/@/composables/modeStates/animationGraph/panningState'
import { getUpdatedNodeMapToDisconnectNodeInput } from '/@/utils/graphNodes'

export function useConnectingOutputEdgeState(options: {
  nodeId: string
  outputKey: string
  point: IVec2
}): AnimationGraphState {
  return {
    getLabel: () => 'ConnectingOutputEdgeState',
    onStart: async (ctx) => {
      ctx.startDragging()
      ctx.setDraftEdge({
        type: 'draft-to',
        from: { nodeId: options.nodeId, key: options.outputKey },
        to: options.point,
      })
    },
    onEnd: async (ctx) => {
      ctx.setDraftEdge()
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointerdown':
          switch (event.data.options.button) {
            case 1:
              return {
                getState: usePanningState,
                type: 'stack-restart',
              }
          }
          return
        case 'pointerdrag':
          ctx.setDraftEdge({
            type: 'draft-to',
            from: { nodeId: options.nodeId, key: options.outputKey },
            to: event.data.current,
          })
          return
        case 'pointerup':
          if (event.data.options.button === 0) {
            if (event.target.type === 'empty') {
              const draftEdge = ctx.getDraftEdge()
              if (draftEdge?.type === 'draft-to') {
              }
            } else if (event.target.type === 'node-edge-input') {
              const nodeMap = ctx.getNodeMap()
              const closest = parseEdgeInfo(event.target)
              ctx.updateNodes(
                updateNodeInput(
                  ctx.getGraphNodeModule,
                  nodeMap,
                  nodeMap[closest.id],
                  closest.key,
                  options.nodeId,
                  options.outputKey
                )
              )
            }
          }
          return useDefaultState
        case 'keydown':
          switch (event.data.key) {
            case 'escape':
              return useDefaultState
          }
          return
      }
    },
  }
}