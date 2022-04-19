import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import { getEditedNodeMap } from '/@/composables/modeStates/animationGraph/utils'

export function useGrabbingNodeState(): AnimationGraphState {
  return {
    getLabel: () => 'GrabbingNodeState',
    shouldRequestPointerLock: true,
    onStart: (getCtx) => {
      const ctx = getCtx()
      ctx.setEditMovement()
      return Promise.resolve()
    },
    onEnd: () => Promise.resolve(),
    handleEvent: async (getCtx, event) => {
      const ctx = getCtx()

      switch (event.type) {
        case 'pointermove':
          ctx.setEditMovement(event.data)
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
            case 'escape':
              ctx.setEditMovement()
              return useDefaultState
          }
          return
      }
    },
  }
}
