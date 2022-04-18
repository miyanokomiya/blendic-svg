import { add, IVec2, sub } from 'okageo'
import { EditMovement } from '/@/composables/modes/types'
import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import { getTransform, IdMap, Transform } from '/@/models'
import { GraphNode } from '/@/models/graphNode'
import { mapReduce } from '/@/utils/commons'
import { gridRound } from '/@/utils/geometry'

export function useMovingNodeState(options: {
  nodeId: string
}): AnimationGraphState {
  let startedAt = 0

  return {
    getLabel: () => 'MovingNodeState',
    onStart: (getCtx) => {
      const ctx = getCtx()
      ctx.setEditMovement()
      startedAt = ctx.getTimestamp()
      return Promise.resolve()
    },
    onEnd: () => Promise.resolve(),
    handleEvent: async (getCtx, event) => {
      const ctx = getCtx()

      switch (event.type) {
        case 'pointermove':
          if (ctx.getEditMovement() || ctx.getTimestamp() - startedAt > 100) {
            ctx.setEditMovement(event.data)
          }
          return
        case 'pointerup': {
          if (event.data.options.button === 0) {
            const editMovement = ctx.getEditMovement()
            if (editMovement) {
              ctx.updateNodes(
                getEditedNodeMap(
                  ctx.getSelectedNodeMap(),
                  options.nodeId,
                  editMovement
                )
              )
            }
          }
          ctx.setEditMovement()
          return useDefaultState
        }
        case 'keydown':
          return
      }
    },
  }
}

function getEditedNodeMap(
  selectedNodeMap: IdMap<GraphNode>,
  nodeId: string,
  editMovement: EditMovement
): IdMap<GraphNode> {
  const editTransforms = getEditTransforms(
    selectedNodeMap,
    nodeId,
    editMovement
  )
  return Object.keys(editTransforms).reduce<IdMap<GraphNode>>((m, id) => {
    const src = selectedNodeMap[id]
    m[id] = {
      ...src,
      position: add(src.position, editTransforms[id].translate),
    }
    return m
  }, {})
}

function getEditTransforms(
  selectedNodeMap: IdMap<GraphNode>,
  nodeId: string,
  editMovement: EditMovement
): IdMap<Transform> {
  const translate = getGridRoundedPoint(
    sub(editMovement.current, editMovement.start)
  )

  // Adjust dragged target position along the grid
  const adjustedTranslate = add(
    translate,
    getGridRoundedDiff(selectedNodeMap[nodeId].position)
  )

  const transform = getTransform({ translate: adjustedTranslate })
  return mapReduce(selectedNodeMap, () => transform)
}

function getGridRoundedPoint(p: IVec2): IVec2 {
  return {
    x: gridRound(10, p.x),
    y: gridRound(10, p.y),
  }
}

function getGridRoundedDiff(p: IVec2): IVec2 {
  return sub(getGridRoundedPoint(p), p)
}
