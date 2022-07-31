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
import {
  duplicateNodes,
  getInputsConnectedTo,
  getUpdatedNodeMapToDisconnectNodeInput,
} from '/@/utils/graphNodes'
import { add } from 'okageo'
import { PointerDownEvent } from '/@/composables/modeStates/core'
import { useCuttingEdgeState } from '/@/composables/modeStates/animationGraph/cuttingEdgeState'
import { getGraphNodeRect } from '/@/utils/helpers'
import { getWrapperRect } from '/@/utils/geometry'

export function useDefaultState(): AnimationGraphState {
  return state
}

const state: AnimationGraphState = {
  getLabel: () => 'DefaultState',
  onStart: async (ctx) => {
    updateCommandExams(ctx)
    updateToolMenus(ctx)
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
                return onDownEdgeInput(ctx, event)
              case 'node-edge-output':
                return onDownEdgeOutput(ctx, event)
              case 'edge':
                return
              case 'node-custom-anchor':
                return onDownCustomAnchor(ctx, event)
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
          case '!':
          case 'Home': {
            const nodes = Object.values(ctx.getNodeMap())
            ctx.setViewport(
              nodes.length
                ? getWrapperRect(
                    nodes.map((node) =>
                      getGraphNodeRect(ctx.getGraphNodeModule, node)
                    )
                  )
                : undefined
            )
            return
          }
        }
        return
      case 'popupmenu': {
        switch (event.data.key) {
          case 'create_custom_graph': {
            ctx.makeCustomGraphFromSelectedNodes()
            return
          }
        }
        return
      }
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
        updateToolMenus(ctx)
        return
    }
  },
}

function updateCommandExams(ctx: AnimationGraphStateContext) {
  const selected = ctx.getLastSelectedNodeId()
  ctx.setCommandExams([
    COMMAND_EXAM_SRC.add,
    COMMAND_EXAM_SRC.selectAll,
    COMMAND_EXAM_SRC.reconnect,
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

function updateToolMenus(ctx: AnimationGraphStateContext) {
  const selected = ctx.getLastSelectedNodeId()
  ctx.setToolMenuList([
    ...(selected
      ? [
          {
            label: 'Node',
            items: [
              {
                label: 'Create custom graph',
                key: 'create_custom_graph',
              },
            ],
          },
        ]
      : []),
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
  ctx: AnimationGraphStateContext,
  event: PointerDownEvent
): AnimationGraphTransitionValue {
  const edgeInfo = parseNodeEdgeInfo(event.target)
  if (event.data.options.ctrl) {
    const node = ctx.getNodeMap()[edgeInfo.id]
    const from = node.inputs[edgeInfo.key]?.from
    if (from) {
      // Disconnect and modify current connection
      ctx.updateNodes(
        getUpdatedNodeMapToDisconnectNodeInput(
          ctx.getGraphNodeModule,
          ctx.getNodeMap(),
          edgeInfo.id,
          edgeInfo.key
        )
      )

      return () =>
        useConnectingOutputEdgeState({
          nodeId: from.id,
          outputKey: from.key,
          point: event.data.point,
        })
    }
  }

  return () =>
    useConnectingInputEdgeState({
      point: event.data.point,
      inputs: [{ nodeId: edgeInfo.id, key: edgeInfo.key }],
    })
}

function onDownEdgeOutput(
  ctx: AnimationGraphStateContext,
  event: PointerDownEvent
): AnimationGraphTransitionValue {
  const edgeInfo = parseNodeEdgeInfo(event.target)

  if (event.data.options.ctrl) {
    // Modify current connections
    const inputMap = getInputsConnectedTo(
      ctx.getNodeMap(),
      edgeInfo.id,
      edgeInfo.key
    )
    return () =>
      useConnectingInputEdgeState({
        point: event.data.point,
        inputs: Object.entries(inputMap)
          .flatMap(([id, inputs]) =>
            Object.keys(inputs).map((key) => ({
              nodeId: id,
              key,
            }))
          )
          .flat(),
      })
  } else {
    return () =>
      useConnectingOutputEdgeState({
        nodeId: edgeInfo.id,
        outputKey: edgeInfo.key,
        point: event.data.point,
      })
  }
}

function onDownCustomAnchor(
  ctx: Pick<AnimationGraphStateContext, 'switchGraph'>,
  event: PointerDownEvent
): AnimationGraphTransitionValue {
  const nodeType = event.target.data?.['node_type']
  if (nodeType) {
    ctx.switchGraph(nodeType)
  }
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
