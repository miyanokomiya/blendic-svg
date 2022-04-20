import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import {
  getEditedNodeMap,
  getGridRoundedEditMovement,
} from '/@/composables/modeStates/animationGraph/utils'

export function useGrabbingNodeState(): AnimationGraphState {
  return {
    getLabel: () => 'GrabbingNodeState',
    shouldRequestPointerLock: true,
    onStart: async (getCtx) => {
      const ctx = getCtx()
      ctx.startEditMovement()
    },
    onEnd: async () => {},
    handleEvent: async (getCtx, event) => {
      const ctx = getCtx()

      console.log(event.type)
      switch (event.type) {
        case 'pointermove':
          ctx.setEditMovement(getGridRoundedEditMovement(event.data))
          return
        case 'pointerup': {
          if (event.data.options.button === 0) {
            const editMovement = ctx.getEditMovement()
            const nodeId = ctx.getLastSelectedNodeId()
            if (editMovement && nodeId) {
              ctx.updateNodes(
                getEditedNodeMap(ctx.getSelectedNodeMap(), nodeId, editMovement)
              )
            }
          }
          ctx.setEditMovement()
          return useDefaultState
        }
        case 'keydown':
          switch (event.data.key) {
            case 'Escape':
              ctx.setEditMovement()
              return useDefaultState
          }
          return
      }
    },
  }
}
