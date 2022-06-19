/*
This file is part of Blendic SVG.

Blendic SVG is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Blendic SVG is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Blendic SVG.  If not, see <https://www.gnu.org/licenses/>.

Copyright (C) 2022, Tomoya Komiyama.
*/

import type {
  AnimationGraphState,
  AnimationGraphStateContext,
  AnimationGraphTransitionValue,
} from '/@/composables/modeStates/animationGraph/core'
import { useMovingNodeState } from '/@/composables/modeStates/animationGraph/movingNodeState'
import { useGrabbingNodeState } from '/@/composables/modeStates/animationGraph/grabbingNodeState'
import { useAddingNewNodeState } from '/@/composables/modeStates/animationGraph/addingNewNodeState'
import { usePanningState } from '/@/composables/modeStates/commons'
import { useRectangleSelectingState } from '/@/composables/modeStates/animationGraph/rectangleSelectingState'
import { useConnectingInputEdgeState } from '/@/composables/modeStates/animationGraph/connectingInputEdgeState'
import { useConnectingOutputEdgeState } from '/@/composables/modeStates/animationGraph/connectingOutputEdgeState'
import {
  COMMAND_EXAM_SRC,
  parseEdgeInfo,
  parseNodeEdgeInfo,
  useGraphNodeClipboard,
} from '/@/composables/modeStates/animationGraph/utils'
import { toList } from '/@/utils/commons'
import { duplicateNodes } from '/@/utils/graphNodes'
import { add } from 'okageo'
import { PointerDownEvent } from '/@/composables/modeStates/core'
import { useCuttingEdgeState } from '/@/composables/modeStates/animationGraph/cuttingEdgeState'

export function useDefaultState(): AnimationGraphState {
  return state
}

const state: AnimationGraphState = {
  getLabel: () => 'DefaultState',
  onStart: async (ctx) => {
    updateCommandExams(ctx)
  },
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointerdown':
        switch (event.data.options.button) {
          case 0:
            switch (event.target.type) {
              case 'node-body':
                return onDownNodeBody(ctx, event)
              case 'node-edge-input':
                return onDownEdgeInput(event)
              case 'node-edge-output':
                return onDownEdgeOutput(event)
              default:
                return onDownEmpty(ctx, event)
            }
          case 1:
            return usePanningState
          case 2:
            if (event.data.options.ctrl) {
              return () => useCuttingEdgeState({ point: event.data.point })
            }
        }
        return
      case 'pointerup':
        switch (event.data.options.button) {
          case 0:
            switch (event.target.type) {
              case 'edge':
                return () =>
                  useAddingNewNodeState({
                    point: event.data.point,
                    insertion: parseEdgeInfo(event.target),
                  })
            }
            return
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
          case 'D':
            return onDuplicate(ctx)
          case 'x':
            ctx.deleteNodes()
            return
        }
        return
      case 'copy': {
        const clipboard = useGraphNodeClipboard(ctx)
        clipboard.onCopy(event.nativeEvent)
        return
      }
      case 'paste': {
        const clipboard = useGraphNodeClipboard(ctx)
        await clipboard.onPaste(event.nativeEvent)
        return
      }
      case 'selection':
        updateCommandExams(ctx)
        return
    }
  },
}

function updateCommandExams(ctx: AnimationGraphStateContext) {
  const selected = ctx.getLastSelectedNodeId()
  ctx.setCommandExams([
    COMMAND_EXAM_SRC.add,
    COMMAND_EXAM_SRC.selectAll,
    COMMAND_EXAM_SRC.cutEdge,
    ...(selected
      ? [
          COMMAND_EXAM_SRC.delete,
          COMMAND_EXAM_SRC.grab,
          COMMAND_EXAM_SRC.duplicate,
          COMMAND_EXAM_SRC.clip,
        ]
      : []),
    COMMAND_EXAM_SRC.paste,
  ])
}

function onDownEmpty(
  ctx: AnimationGraphStateContext,
  event: PointerDownEvent
): AnimationGraphTransitionValue {
  ctx.selectNodes({}, event.data.options)
  return useRectangleSelectingState
}

function onDownNodeBody(
  ctx: AnimationGraphStateContext,
  event: PointerDownEvent
): AnimationGraphTransitionValue {
  const nodeId = event.target.data?.['node_id']
  if (nodeId) {
    if (event.data.options.shift) {
      ctx.selectNodes({ [nodeId]: true }, event.data.options)
    } else {
      if (!ctx.getSelectedNodeMap()[nodeId]) {
        ctx.selectNodes({ [nodeId]: true }, event.data.options)
      }
      return () => useMovingNodeState({ nodeId })
    }
  }
}

function onDownEdgeInput(
  event: PointerDownEvent
): AnimationGraphTransitionValue {
  const edgeInfo = parseNodeEdgeInfo(event.target)
  return () =>
    useConnectingInputEdgeState({
      nodeId: edgeInfo.id,
      inputKey: edgeInfo.key,
      point: event.data.point,
    })
}

function onDownEdgeOutput(
  event: PointerDownEvent
): AnimationGraphTransitionValue {
  const edgeInfo = parseNodeEdgeInfo(event.target)
  return () =>
    useConnectingOutputEdgeState({
      nodeId: edgeInfo.id,
      outputKey: edgeInfo.key,
      point: event.data.point,
    })
}

function onDuplicate(
  ctx: AnimationGraphStateContext
): AnimationGraphTransitionValue {
  ctx.pasteNodes(
    toList(
      duplicateNodes(
        ctx.getGraphNodeModule,
        ctx.getSelectedNodeMap(),
        ctx.getNodeMap(),
        ctx.generateUuid
      )
    ).map((n) => ({
      ...n,
      position: add(n.position, { x: 20, y: 20 }),
    }))
  )
  return useGrabbingNodeState
}
