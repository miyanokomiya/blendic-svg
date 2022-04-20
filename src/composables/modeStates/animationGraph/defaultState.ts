import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useMovingNodeState } from '/@/composables/modeStates/animationGraph/movingNodeState'
import { useGrabbingNodeState } from '/@/composables/modeStates/animationGraph/grabbingNodeState'
import { useAddingNewNodeState } from '/@/composables/modeStates/animationGraph/addingNewNodeState'

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
            case 'empty': {
              ctx.selectedNodes({}, event.data.options)
              return
            }
            case 'node-body': {
              const nodeId = event.target.data?.['node_id']
              if (nodeId) {
                ctx.selectedNodes({ [nodeId]: true }, event.data.options)
                return () => useMovingNodeState({ nodeId })
              }
              return
            }
            case 'node-edge':
              // TODO: ConnectingState
              return useDefaultState
          }
          return
        case 'keydown':
          switch (event.data.key) {
            case 'A': {
              const point = event.point
              return point ? () => useAddingNewNodeState({ point }) : undefined
            }
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
