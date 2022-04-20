import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import {
  getEditedNodeMap,
  getGridRoundedEditMovement,
} from '/@/composables/modeStates/animationGraph/utils'

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
        case 'pointerdrag':
          if (ctx.getTimestamp() - startedAt > 100) {
            ctx.setEditMovement(getGridRoundedEditMovement(event.data))
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
          switch (event.data.key) {
            case 'escape':
              ctx.setEditMovement()
              return useDefaultState
          }
          return
      }
    },
  }
}
