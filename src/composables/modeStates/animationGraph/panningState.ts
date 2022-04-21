import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'

export function usePanningState(): AnimationGraphState {
  return {
    getLabel: () => 'PanningState',
    shouldRequestPointerLock: true,
    onStart: async () => {},
    onEnd: async () => {},
    handleEvent: async (getCtx, event) => {
      const ctx = getCtx()

      switch (event.type) {
        case 'pointermove':
          ctx.panView(event.data)
          return
        case 'pointerup':
          return useDefaultState
      }
    },
  }
}
