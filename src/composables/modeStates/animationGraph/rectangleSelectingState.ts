import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import { mapFilter, mapReduce } from '/@/utils/commons'
import { getIsRectHitRectFn } from '/@/utils/geometry'
import { getGraphNodeRect } from '/@/utils/helpers'

export function useRectangleSelectingState(): AnimationGraphState {
  return {
    getLabel: () => 'RectangleSelectingState',
    onStart: async (getCtx) => {
      const ctx = getCtx()
      ctx.startDragging()
      ctx.setRectangleDragging(true)
    },
    onEnd: async (getCtx) => {
      getCtx().setRectangleDragging()
    },
    handleEvent: async (getCtx, event) => {
      const ctx = getCtx()

      switch (event.type) {
        case 'pointerup': {
          const rect = ctx.getDraggedRectangle()
          console.log(rect)
          if (rect) {
            const checkFn = getIsRectHitRectFn(rect)
            ctx.selectNodes(
              mapReduce(
                mapFilter(ctx.getNodeMap(), (node) =>
                  checkFn(getGraphNodeRect(ctx.getGraphNodeModule, node))
                ),
                () => true
              ),
              event.data.options
            )
          }
          return useDefaultState
        }
        case 'keydown':
          switch (event.data.key) {
            case 'escape':
              return useDefaultState
          }
          return
      }
    },
  }
}
