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
import { usePathCollision } from '/@/composables/pathCollision'
import { IdMap } from '/@/models'
import { mapReduce } from '/@/utils/commons'
import { getUpdatedNodeMapToDisconnectNodeInputs } from '/@/utils/graphNodes'
import { getGraphNodeEdgePath } from '/@/utils/helpers'

export function useCuttingEdgeState(options: {
  point: IVec2
}): AnimationGraphState {
  let edgeCollision: IdMap<ReturnType<typeof usePathCollision>>

  return {
    getLabel: () => 'EdgeCutting',
    onStart: async (ctx) => {
      edgeCollision = mapReduce(ctx.getEdgeSummaryMap(), (edges) =>
        usePathCollision(
          mapReduce(edges, (edge) => getGraphNodeEdgePath(edge.from, edge.to))
        )
      )
      ctx.setEdgeCutter({ from: options.point, to: options.point })
      ctx.startDragging()
    },
    onEnd: async (ctx) => {
      ctx.setEdgeCutter(undefined)
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointerdrag': {
          const current = ctx.getEdgeCutter()
          if (current) {
            ctx.setEdgeCutter({ ...current, to: event.data.current })
            return
          } else {
            return { type: 'break' }
          }
        }
        case 'pointerup': {
          const cutter = ctx.getEdgeCutter()
          if (cutter && edgeCollision) {
            const seg: [IVec2, IVec2] = [cutter.from, cutter.to]
            const hitMap = mapReduce(edgeCollision, (collision) =>
              collision.getHitPathMap(seg)
            )
            const updatedMap = getUpdatedNodeMapToDisconnectNodeInputs(
              ctx.getGraphNodeModule,
              ctx.getNodeMap(),
              hitMap
            )
            if (Object.keys(updatedMap).length > 0) {
              ctx.updateNodes(updatedMap)
            }
          }
          return { type: 'break' }
        }
      }
    },
  }
}
