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
import { CommandExam, EditMovement } from '/@/composables/modes/types'
import { ModeEventTarget } from '/@/composables/modeStates/core'
import { getTransform, IdMap, Transform } from '/@/models'
import { GraphNode } from '/@/models/graphNode'
import { mapReduce } from '/@/utils/commons'
import { getCtrlOrMetaStr } from '/@/utils/devices'
import { gridRound } from '/@/utils/geometry'
import {
  cleanEdgeGenericsGroupAt,
  GetGraphNodeModule,
  updateInputConnection,
} from '/@/utils/graphNodes'

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

export function updateNodeInput(
  getGraphNodeModule: GetGraphNodeModule,
  nodeMap: IdMap<GraphNode>,
  toNode: GraphNode,
  inputKey: string,
  targetId: string,
  targetKey: string
): IdMap<GraphNode> {
  const updated = updateInputConnection(
    { node: nodeMap[targetId], key: targetKey },
    { node: toNode, key: inputKey }
  )
  if (!updated) return {}

  return {
    [updated.id]: updated,
    ...cleanEdgeGenericsGroupAt(
      getGraphNodeModule,
      { ...nodeMap, [updated.id]: updated },
      { id: updated.id, key: inputKey }
    ),
  }
}

export function parseEdgeInfo(target: ModeEventTarget): {
  key: string
  id: string
} {
  const id = target.data?.['node_id']
  const key = target.data?.['edge_key']
  if (!id || !key) throw new Error('Invalid edge data.')
  return { id, key }
}

const emptyTarget = {
  id: '',
  type: 'empty',
}

export function parseEventTarget(event: Event): ModeEventTarget {
  if (!event.target) return emptyTarget
  const target = findClosestAnchorElement(event.target as SVGElement)
  if (!target) return emptyTarget

  const id = target.dataset['id'] ?? ''
  const type = target.dataset['type'] ?? ''
  const data = target.dataset
    ? Object.entries(target.dataset).reduce<Required<ModeEventTarget>['data']>(
        (p, [k, v]) => {
          p[k] = v ?? 'true'
          return p
        },
        {}
      )
    : undefined
  return { id, type, data }
}

function findClosestAnchorElement(elm: SVGElement): SVGElement | undefined {
  const closest = elm.closest('[data-type]')
  return closest ? (closest as SVGElement) : undefined
}

export const COMMAND_EXAM_SRC = {
  add: { command: 'A', title: 'Add' } as CommandExam,
  selectAll: { command: 'a', title: 'All Select' },
  delete: { command: 'x', title: 'Delete' },
  grab: { command: 'g', title: 'Grab' },
  duplicate: { command: 'D', title: 'Duplicate' },
  clip: { command: `${getCtrlOrMetaStr()} + c`, title: 'Clip' },
  paste: { command: `${getCtrlOrMetaStr()} + v`, title: 'Paste' },
} as const
