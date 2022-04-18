import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useMovingNodeState } from '/@/composables/modeStates/animationGraph/movingNodeState'

export function useDefaultState(): AnimationGraphState {
  return {
    getLabel: () => 'DefaultState',
    onStart: () => Promise.resolve(),
    onEnd: () => Promise.resolve(),
    handleEvent: async (_, event) => {
      switch (event.type) {
        case 'pointerdown':
          switch (event.target.type) {
            case 'node-body':
              // TODO: MovingState
              return useMovingNodeState
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
              // TODO: SelectedState
              return useDefaultState
            case 'v':
              break
          }
          return
      }
    },
  }
}
