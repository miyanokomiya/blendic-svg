import { add, IVec2, sub } from 'okageo'
import { EditMovement } from '/@/composables/modes/types'
import { ModeEventTarget } from '/@/composables/modeStates/core'
import { getTransform, IdMap, Transform } from '/@/models'
import { GraphNode } from '/@/models/graphNode'
import { mapReduce } from '/@/utils/commons'
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
  const id = target.data?.['node-id']
  const key = target.data?.['edge-key']
  if (!id || !key) throw new Error('Invalid edge data.')
  return { id, key }
}
