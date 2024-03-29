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

import { add, IVec2, sub } from 'okageo'
import {
  StringItem,
  useClipboard,
  useClipboardSerializer,
} from '/@/composables/clipboard'
import { CommandExam, EditMovement } from '/@/composables/modes/types'
import { AnimationGraphStateContext } from '/@/composables/modeStates/animationGraph/core'
import { ModeEventTarget } from '/@/composables/modeStates/core'
import { getTransform, IdMap, toMap, Transform } from '/@/models'
import { GraphEdgeConnection, GraphNode } from '/@/models/graphNode'
import { mapFilter, mapReduce, toList } from '/@/utils/commons'
import { getCtrlOrMetaStr } from '/@/utils/devices'
import { gridRound } from '/@/utils/geometry'
import {
  duplicateNodes,
  GetGraphNodeModule,
  isolateNodes,
  validateConnection,
} from '/@/utils/graphNodes'
import {
  alignPathDNodes,
  generatePathDNodes,
} from '/@/utils/graphNodes/svgConverter'

export function getEditedNodeMap(
  targetNodeMap: IdMap<GraphNode>,
  baseNodeId: string,
  editMovement: EditMovement
): IdMap<GraphNode> {
  const editTransforms = getEditTransforms(
    targetNodeMap,
    baseNodeId,
    editMovement
  )
  return Object.keys(editTransforms).reduce<IdMap<GraphNode>>((m, id) => {
    const src = targetNodeMap[id]
    m[id] = {
      ...src,
      position: add(src.position, editTransforms[id].translate),
    }
    return m
  }, {})
}

export function getEditTransforms(
  targetNodeMap: IdMap<GraphNode>,
  baseNodeId: string,
  editMovement: EditMovement
): IdMap<Transform> {
  const translate = getGridRoundedPoint(
    sub(editMovement.current, editMovement.start)
  )

  // Adjust dragged target position along the grid
  const adjustedTranslate = add(
    translate,
    getGridRoundedDiff(targetNodeMap[baseNodeId].position)
  )

  const transform = getTransform({ translate: adjustedTranslate })
  return mapReduce(targetNodeMap, () => transform)
}

export function getGridRoundedEditMovement(e: EditMovement): EditMovement {
  const v = getGridRoundedPoint(sub(e.current, e.start))
  return { ...e, current: add(v, e.start) }
}

export function getGridRoundedPoint(p: IVec2): IVec2 {
  return {
    x: gridRound(10, p.x),
    y: gridRound(10, p.y),
  }
}

export function getGridRoundedDiff(p: IVec2): IVec2 {
  return sub(getGridRoundedPoint(p), p)
}

export function parseNodeEdgeInfo(target: ModeEventTarget): {
  key: string
  id: string
} {
  const id = target.data?.['node_id']
  const key = target.data?.['edge_key']
  if (!id || !key) throw new Error('Invalid node edge data.')
  return { id, key }
}

export function parseEdgeInfo(target: ModeEventTarget): {
  inputId: string
  inputKey: string
  outputId: string
  outputKey: string
} {
  const inputId = target.data?.['input_id']
  const inputKey = target.data?.['input_key']
  const outputId = target.data?.['output_id']
  const outputKey = target.data?.['output_key']
  if (!inputId || !inputKey || !outputId || !outputKey)
    throw new Error('Invalid edge data.')
  return { inputId, inputKey, outputId, outputKey }
}

export const COMMAND_EXAM_SRC = {
  add: { command: 'A', title: 'Add' } as CommandExam,
  selectAll: { command: 'a', title: 'All Select' },
  delete: { command: 'x', title: 'Delete' },
  grab: { command: 'g', title: 'Grab' },
  duplicate: { command: 'D', title: 'Duplicate' },
  reconnect: { command: `${getCtrlOrMetaStr()} + Drag`, title: 'Reconnect' },
  cutEdge: { command: `${getCtrlOrMetaStr()} + R-Drag`, title: 'Disconnect' },
  clip: { command: `${getCtrlOrMetaStr()} + c`, title: 'Clip' },
  paste: { command: `${getCtrlOrMetaStr()} + v`, title: 'Paste' },
} as const

export function validDraftConnection(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: IdMap<GraphNode>,
  inputId: string,
  inputKey: string,
  outputId: string,
  outputKey: string
): boolean {
  const fromNode = nodeMap[outputId]
  const toNode = nodeMap[inputId]
  return (
    fromNode &&
    toNode &&
    validateConnection(
      getGraphNodeModule,
      { node: fromNode, key: outputKey },
      { node: toNode, key: inputKey }
    )
  )
}

export function validDraftConnections(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: IdMap<GraphNode>,
  outputId: string,
  outputKey: string,
  inputs: GraphEdgeConnection[]
): boolean {
  return inputs.every((input) =>
    validDraftConnection(
      getGraphNodeModule,
      nodeMap,
      input.nodeId,
      input.key,
      outputId,
      outputKey
    )
  )
}

const clipboardSerializer = useClipboardSerializer<
  'graph-nodes',
  IdMap<GraphNode>
>('graph-nodes')
export function useGraphNodeClipboard(ctx: AnimationGraphStateContext) {
  return useClipboard(
    () => {
      return {
        'text/plain': clipboardSerializer.serialize(
          toMap(
            isolateNodes(
              ctx.getGraphNodeModule,
              toList(ctx.getSelectedNodeMap())
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

      try {
        const availableNodes = mapFilter(
          clipboardSerializer.deserialize(text),
          (n) => !!ctx.getGraphNodeModule(n.type)
        )
        if (Object.keys(availableNodes).length === 0) return

        const p = ctx.getCursorPoint()
        const positions = toList(availableNodes).map((n) => n.position)
        const minX = Math.min(...positions.map((p) => p.x))
        const minY = Math.min(...positions.map((p) => p.y))
        const diff = { x: p.x - minX, y: p.y - minY }

        ctx.pasteNodes(
          toList(
            duplicateNodes(
              ctx.getGraphNodeModule,
              availableNodes,
              ctx.getNodeMap(),
              ctx.generateUuid
            )
          ).map((n) => ({ ...n, position: add(diff, n.position) }))
        )
      } catch {
        // Try parsing text as a part of SVG
        ctx.pasteNodes(
          alignPathDNodes(generatePathDNodes(text), ctx.getCursorPoint())
        )
      }
    }
  )
}
