import { ModeStateBase } from '/@/composables/modeStates/core'

export function useDefaultState(): ModeStateBase {
  return {
    getLabel: () => 'DefaultState',
    onStart: () => Promise.resolve(),
    onEnd: () => Promise.resolve(),
    handleEvent: (event) => {
      switch (event.nativeEvent.type) {
        case 'mousedown':
          break
        case 'mouseup':
          break
        case 'mousemove':
          break
      }

      return Promise.resolve()
    },
  }
}
