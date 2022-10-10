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

import { add, getDistance, IVec2 } from 'okageo'
import type {
  AnimationGraphState,
  AnimationGraphStateContext,
} from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import { validDraftConnections } from '/@/composables/modeStates/animationGraph/utils'
import { useAddingNewNodeState } from '/@/composables/modeStates/animationGraph/addingNewNodeState'
import { usePanningState } from '/@/composables/modeStates/commons'
import {
  getUpdatedNodeMapToDisconnectNodeInputs,
  updateMultipleNodeInput,
} from '/@/utils/graphNodes'
import { GraphEdgeConnection } from '/@/models/graphNode'

export function useConnectingInputEdgeState(options: {
  point: IVec2
  inputs: GraphEdgeConnection[]
}): AnimationGraphState {
  return {
    getLabel: () => 'ConnectingInputEdgeState',
    onStart: async (ctx) => {
      ctx.startDragging()
      ctx.setDraftEdge({
        type: 'draft-output',
        inputs: options.inputs,
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
        case 'pointerdrag': {
          const closest = getClosestEdge(ctx, event.data.current)
          if (
            closest &&
            validDraftConnections(
              ctx.getGraphNodeModule,
              ctx.getNodeMap(),
              closest.id,
              closest.key,
              options.inputs
            )
          ) {
            ctx.setDraftEdge({
              type: 'draft-output',
              inputs: options.inputs,
              output: closest ? closest.p : event.data.current,
              connected: true,
            })
          } else {
            ctx.setDraftEdge({
              type: 'draft-output',
              inputs: options.inputs,
              output: event.data.current,
            })
          }
          return
        }
        case 'pointerup':
          if (event.data.options.button === 0) {
            const nodeMap = ctx.getNodeMap()
            const closest = getClosestEdge(ctx, event.data.point)

            if (
              closest &&
              validDraftConnections(
                ctx.getGraphNodeModule,
                ctx.getNodeMap(),
                closest.id,
                closest.key,
                options.inputs
              )
            ) {
              ctx.updateNodes(
                updateMultipleNodeInput(
                  ctx.getGraphNodeModule,
                  nodeMap,
                  closest.id,
                  closest.key,
                  options.inputs
                )
              )
            } else if (!closest) {
              const draftEdge = ctx.getDraftEdge()
              if (draftEdge?.type === 'draft-output') {
                const nodeMap = ctx.getNodeMap()
                const node = nodeMap[draftEdge.inputs[0].nodeId]
                if (node.inputs[draftEdge.inputs[0].key].from) {
                  ctx.updateNodes(
                    getUpdatedNodeMapToDisconnectNodeInputs(
                      ctx.getGraphNodeModule,
                      nodeMap,
                      draftEdge.inputs.reduce<{
                        [id: string]: { [key: string]: true }
                      }>((p, input) => {
                        p[input.nodeId] = { [input.key]: true }
                        return p
                      }, {})
                    )
                  )
                }
                return () => useAddingNewNodeState({ point: draftEdge.output })
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

function getClosestEdge(
  ctx: Pick<
    AnimationGraphStateContext,
    'getNodeMap' | 'getEdgePositionMap' | 'getScale'
  >,
  p: IVec2
): { id: string; key: string; p: IVec2 } | undefined {
  const nodeMap = ctx.getNodeMap()
  const edgePositionMap = ctx.getEdgePositionMap()
  const threshold = 12 * Math.max(1, ctx.getScale())

  const points = Object.entries(edgePositionMap).flatMap(([id, n]) =>
    Object.entries(n.outputs)
      .map(([key, v]) => {
        const edgeP = add(v.p, nodeMap[id].position)
        return [id, key, edgeP, getDistance(edgeP, p)] as const
      })
      .filter(([, , , d]) => d <= threshold)
  )
  if (points.length === 0) return

  points.sort((a, b) => a[3] - b[3])
  const closest = points[0]
  return { id: closest[0], key: closest[1], p: closest[2] }
}
