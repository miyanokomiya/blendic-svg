import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useMovingNodeState } from '/@/composables/modeStates/animationGraph/movingNodeState'
import { useGrabbingNodeState } from '/@/composables/modeStates/animationGraph/grabbingNodeState'

export function useDefaultState(): AnimationGraphState {
  return {
    getLabel: () => 'DefaultState',
    onStart: () => Promise.resolve(),
    onEnd: () => Promise.resolve(),
    handleEvent: async (getCtx, event) => {
      const ctx = getCtx()

      switch (event.type) {
        case 'pointerdown':
          switch (event.target.type) {
            case 'node-body': {
              const nodeId = event.target.id
              if (!ctx.getSelectedNodeMap()[nodeId]) {
                ctx.selectedNodes({ nodeId: true }, event.data.options)
              }
              return () => useMovingNodeState({ nodeId })
            }
            case 'node-edge':
              // TODO: ConnectingState
              return useDefaultState
          }
          return
        case 'keydown':
          switch (event.data.key) {
            case 'A':
              // TODO: Show menu list
              return
            case 'a':
              ctx.selectAllNode()
              return
            case 'g':
              return ctx.getLastSelectedNodeId()
                ? useGrabbingNodeState
                : undefined
          }
          return
      }
    },
  }
}
