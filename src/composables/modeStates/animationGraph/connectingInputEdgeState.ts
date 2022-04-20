import { IVec2 } from 'okageo'
import type { AnimationGraphState } from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import {
  parseEdgeInfo,
  updateNodeInput,
} from '/@/composables/modeStates/animationGraph/utils'

export function useConnectingInputEdgeState(options: {
  nodeId: string
  inputKey: string
  point: IVec2
}): AnimationGraphState {
  return {
    getLabel: () => 'ConnectingInputEdgeState',
    onStart: (getCtx) => {
      getCtx().setDraftEdge({
        type: 'draft-to',
        from: { nodeId: options.nodeId, key: options.inputKey },
        to: options.point,
      })
      return Promise.resolve()
    },
    onEnd: (getCtx) => {
      getCtx().setDraftEdge()
      return Promise.resolve()
    },
    handleEvent: async (getCtx, event) => {
      const ctx = getCtx()

      switch (event.type) {
        case 'pointermove':
          ctx.setDraftEdge({
            type: 'draft-to',
            from: { nodeId: options.nodeId, key: options.inputKey },
            to: event.data.current,
          })
          return
        case 'pointerup':
          if (event.data.options.button === 0) {
            if (event.target.type === 'empty') {
              // TODO: Move to "AddingNewNodeState"
              ctx.getDraftEdge()?.to
            } else if (event.target.type === 'edge-output') {
              const nodeMap = ctx.getNodeMap()
              const closest = parseEdgeInfo(event.target)
              ctx.updateNodes(
                updateNodeInput(
                  ctx.getGraphNodeModule,
                  nodeMap,
                  nodeMap[closest.id],
                  closest.key,
                  options.nodeId,
                  options.inputKey
                )
              )
            }
          }
          return useDefaultState
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
