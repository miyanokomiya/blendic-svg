import { IVec2 } from 'okageo'
import { PopupMenuItem } from '/@/composables/modes/types'
import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'

export function useAddingNewNodeState(options: {
  point: IVec2
}): AnimationGraphState {
  return {
    getLabel: () => 'AddingNewNodeState',
    onStart: async (getCtx) => {
      const ctx = getCtx()
      const items: PopupMenuItem[] = ctx
        .getNodeItemList()
        .map(({ label, children }) => ({
          label,
          children: children.map(({ label, type }) => ({ label, key: type })),
        }))
      ctx.setPopupMenuList({ point: options.point, items })
    },
    onEnd: async (getCtx) => {
      getCtx().setPopupMenuList()
    },
    handleEvent: async (getCtx, event) => {
      const ctx = getCtx()

      switch (event.type) {
        case 'pointerup':
          if (event.data.options.button !== 1) {
            return useDefaultState
          }
          break
        case 'keydown':
          switch (event.data.key) {
            case 'Escape':
              return useDefaultState
          }
          return
        case 'popupmenu': {
          const key = event.data.key
          ctx.addNode(key, { position: options.point })
          return useDefaultState
        }
      }
    },
  }
}