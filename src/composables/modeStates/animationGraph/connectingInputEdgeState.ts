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
  parseNodeEdgeInfo,
  updateNodeInput,
  validDraftConnection,
} from '/@/composables/modeStates/animationGraph/utils'
import { useAddingNewNodeState } from '/@/composables/modeStates/animationGraph/addingNewNodeState'
import { usePanningState } from '/@/composables/modeStates/animationGraph/panningState'
import { getUpdatedNodeMapToDisconnectNodeInput } from '/@/utils/graphNodes'

export function useConnectingInputEdgeState(options: {
  nodeId: string
  inputKey: string
  point: IVec2
}): AnimationGraphState {
  return {
    getLabel: () => 'ConnectingInputEdgeState',
    onStart: async (ctx) => {
      ctx.startDragging()
      ctx.setDraftEdge({
        type: 'draft-output',
        input: { nodeId: options.nodeId, key: options.inputKey },
        output: options.point,
      })
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
            type: 'draft-output',
            input: { nodeId: options.nodeId, key: options.inputKey },
            output: event.data.current,
          })
          return
        case 'pointerup':
          if (event.data.options.button === 0) {
            if (event.target.type === 'empty') {
              const draftEdge = ctx.getDraftEdge()
              if (draftEdge?.type === 'draft-output') {
                const nodeMap = ctx.getNodeMap()
                const node = nodeMap[draftEdge.input.nodeId]
                if (node.inputs[draftEdge.input.key].from) {
                  ctx.updateNodes(
                    getUpdatedNodeMapToDisconnectNodeInput(
                      ctx.getGraphNodeModule,
                      nodeMap,
                      node.id,
                      draftEdge.input.key
                    )
                  )
                } else {
                  return () =>
                    useAddingNewNodeState({ point: draftEdge.output })
                }
              }
            } else if (event.target.type === 'node-edge-output') {
              const nodeMap = ctx.getNodeMap()
              const closest = parseNodeEdgeInfo(event.target)
              if (
                validDraftConnection(
                  ctx.getGraphNodeModule,
                  ctx.getNodeMap(),
                  options.nodeId,
                  options.inputKey,
                  closest.id,
                  closest.key
                )
              ) {
                ctx.updateNodes(
                  updateNodeInput(
                    ctx.getGraphNodeModule,
                    nodeMap,
                    options.nodeId,
                    options.inputKey,
                    closest.id,
                    closest.key
                  )
                )
              }
            }
          }
          ctx.setDraftEdge()
          return useDefaultState
        case 'keydown':
          switch (event.data.key) {
            case 'escape':
              ctx.setDraftEdge()
              return useDefaultState
          }
          return
      }
    },
  }
}
