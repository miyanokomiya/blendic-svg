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

import { IVec2 } from 'okageo'
import { PopupMenuItem } from '/@/composables/modes/types'
import type {
  AnimationGraphState,
  AnimationGraphStateContext,
} from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import { usePanningState } from '/@/composables/modeStates/animationGraph/panningState'
import { updateNodeInput } from '/@/composables/modeStates/animationGraph/utils'
import { PopupMenuEvent, TransitionValue } from '/@/composables/modeStates/core'
import {
  getInputType,
  getNodeSuggestionMenuOptions,
  getOutputType,
} from '/@/utils/graphNodes'

type Options = { point: IVec2 }

export function useAddingNewNodeState(options: Options): AnimationGraphState {
  return {
    getLabel: () => 'AddingNewNodeState',
    onStart: async (ctx) => {
      setupPopupMenuListForEdge(ctx, options)
    },
    onEnd: async (ctx) => {
      ctx.setDraftEdge()
      ctx.setPopupMenuList()
    },
    handleEvent: async (ctx, event) => {
      switch (event.type) {
        case 'pointerdown':
          switch (event.data.options.button) {
            case 1:
              return {
                getState: usePanningState,
                type: 'stack-resume',
              }
          }
          return
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
          return onSelectNewNode(ctx, event, options)
        }
      }
    },
  }
}

async function setupPopupMenuListForEdge(
  ctx: AnimationGraphStateContext,
  options: Options
) {
  const draft = ctx.getDraftEdge()
  if (draft) {
    const forOutput = draft.type === 'draft-input'
    const [edge, point] = forOutput
      ? [draft.output, draft.input]
      : [draft.input, draft.output]
    const struct = ctx.getGraphNodeModule(
      ctx.getNodeMap()[edge.nodeId].type
    )?.struct
    const node = ctx.getNodeMap()[edge.nodeId]
    const suggestions = getNodeSuggestionMenuOptions(
      ctx.getGraphNodeModule,
      ctx.getNodeItemList(),
      forOutput
        ? getOutputType(struct, node, edge.key)
        : getInputType(struct, node, edge.key),
      forOutput
    )
    const items: PopupMenuItem[] = suggestions.map(({ label, children }) => ({
      label,
      children: children.map(({ label, type, key }) => ({
        label,
        key: `${type}.${key}`,
      })),
    }))
    ctx.setPopupMenuList({ point, items })
  } else {
    const items: PopupMenuItem[] = ctx
      .getNodeItemList()
      .map(({ label, children }) => ({
        label,
        children: children.map(({ label, type }) => ({
          label,
          key: type as string,
        })),
      }))
    ctx.setPopupMenuList({ point: options.point, items })
  }
}

function onSelectNewNode(
  ctx: AnimationGraphStateContext,
  event: PopupMenuEvent,
  options: Options
): TransitionValue<AnimationGraphStateContext> {
  const [type, key] = event.data.key.split('.')
  const struct = ctx.getGraphNodeModule(type)?.struct
  const draft = ctx.getDraftEdge()
  if (!struct) return useDefaultState

  const isDraftInput = draft && draft.type === 'draft-input'
  // Adjust the position (no exact criteria)
  const position = isDraftInput
    ? { x: options.point.x, y: options.point.y - 10 }
    : { x: options.point.x - struct.width, y: options.point.y - 10 }
  const node = ctx.addNode(type, { position })

  if (node && draft && key) {
    // Connect draft edge to created node
    const nodeMap = ctx.getNodeMap()
    const [inputId, inputKey, outputId, outputKey] = isDraftInput
      ? [node.id, key, draft.output.nodeId, draft.output.key]
      : [draft.input.nodeId, draft.input.key, node.id, key]

    ctx.updateNodes(
      updateNodeInput(
        ctx.getGraphNodeModule,
        nodeMap,
        inputId,
        inputKey,
        outputId,
        outputKey
      )
    )
  }
  return useDefaultState
}
