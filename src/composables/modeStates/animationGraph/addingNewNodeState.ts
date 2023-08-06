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
  AnimationGraphTransitionValue,
} from '/@/composables/modeStates/animationGraph/core'
import { useDefaultState } from '/@/composables/modeStates/animationGraph/defaultState'
import { usePanningState } from '/@/composables/modeStates/commons'
import { PopupMenuEvent } from '/@/composables/modeStates/core'
import { dropNullishItem } from '/@/utils/commons'
import {
  getInputType,
  getInsertingNodeSuggestionMenuOptions,
  getNodeSuggestionMenuOptions,
  getOutputType,
  inheritOutputValue,
  updateMultipleNodeInput,
  updateNodeInput,
} from '/@/utils/graphNodes'

type Options = {
  point: IVec2
  insertion?: Insertion
}

type Insertion = {
  inputId: string
  inputKey: string
  outputId: string
  outputKey: string
}

export function useAddingNewNodeState(options: Options): AnimationGraphState {
  return {
    getLabel: () => 'AddingNewNodeState',
    onStart: async (ctx) => {
      options.insertion
        ? setupPopupMenuListForInsertion(ctx, options)
        : setupPopupMenuListForEdge(ctx, options)
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
          return options.insertion
            ? onSelectNewNodeToInsert(ctx, event, options)
            : onSelectNewNode(ctx, event, options)
        }
      }
    },
  }
}

function setupPopupMenuListForEdge(
  ctx: AnimationGraphStateContext,
  options: Options
) {
  const draft = ctx.getDraftEdge()
  if (!draft) {
    setupPopupMenuListForUnconnected(ctx, options)
    return
  }

  const forOutput = draft.type === 'draft-input'
  const [edge, point] = forOutput
    ? [draft.output, draft.input]
    : [draft.inputs[0], draft.output]
  const struct = ctx.getGraphNodeModule(ctx.getNodeMap()[edge.nodeId].type)
    ?.struct
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
    children: children.map((o) => ({
      label: o.label,
      key: `${o.type}`,
      data: dropNullishItem({ inputKey: o.inputKey, outputKey: o.outputKey }),
    })),
  }))
  ctx.setPopupMenuList({ point, items })
}

function setupPopupMenuListForUnconnected(
  ctx: AnimationGraphStateContext,
  options: Options
) {
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

function setupPopupMenuListForInsertion(
  ctx: AnimationGraphStateContext,
  options: Options
) {
  const insertion = options.insertion
  if (!insertion) {
    setupPopupMenuListForUnconnected(ctx, options)
    return
  }

  const nodeMap = ctx.getNodeMap()
  const inputNode = nodeMap[insertion.inputId]
  const outputNode = nodeMap[insertion.outputId]
  if (!inputNode || !outputNode) return

  const inputStruct = ctx.getGraphNodeModule(inputNode.type)?.struct
  const outputStruct = ctx.getGraphNodeModule(outputNode.type)?.struct

  const suggestions = getInsertingNodeSuggestionMenuOptions(
    ctx.getGraphNodeModule,
    ctx.getNodeItemList(),
    getOutputType(outputStruct, outputNode, insertion.outputKey),
    getInputType(inputStruct, inputNode, insertion.inputKey)
  )
  const items: PopupMenuItem[] = suggestions.map(({ label, children }) => ({
    label,
    children: children.map((o) => ({
      label: o.label,
      key: `${o.type}`,
      data: dropNullishItem({ inputKey: o.inputKey, outputKey: o.outputKey }),
    })),
  }))
  ctx.setPopupMenuList({ point: options.point, items })
}

function onSelectNewNode(
  ctx: AnimationGraphStateContext,
  event: PopupMenuEvent,
  options: Options
): AnimationGraphTransitionValue {
  const type = event.data.key
  const struct = ctx.getGraphNodeModule(type)?.struct
  const draft = ctx.getDraftEdge()
  if (!struct) return useDefaultState

  const isDraftInput = draft && draft.type === 'draft-input'
  // Adjust the position (no exact criteria)
  const position = isDraftInput
    ? { x: options.point.x, y: options.point.y - 10 }
    : { x: options.point.x - struct.width, y: options.point.y - 10 }

  const outputValue =
    draft?.type === 'draft-output'
      ? ctx.getNodeMap()[draft.inputs[0].nodeId]?.inputs[draft.inputs[0].key]
          ?.value
      : undefined
  const attrs = outputValue ? inheritOutputValue(type, outputValue) : {}

  const node = ctx.addNode(type, { ...attrs, position })
  if (!node || !draft) return useDefaultState

  // Connect draft edge to created node
  const { inputKey, outputKey } = event.data
  if (isDraftInput && inputKey) {
    ctx.updateNodes(
      updateNodeInput(
        ctx.getGraphNodeModule,
        ctx.getNodeMap(),
        node.id,
        inputKey,
        draft.output.nodeId,
        draft.output.key
      )
    )
  } else if (!isDraftInput && outputKey) {
    ctx.updateNodes(
      updateMultipleNodeInput(
        ctx.getGraphNodeModule,
        ctx.getNodeMap(),
        node.id,
        outputKey,
        draft.inputs
      )
    )
  }

  return useDefaultState
}

function onSelectNewNodeToInsert(
  ctx: AnimationGraphStateContext,
  event: PopupMenuEvent,
  options: Options
): AnimationGraphTransitionValue {
  const type = event.data.key
  const struct = ctx.getGraphNodeModule(type)?.struct
  if (!struct) return useDefaultState

  // Adjust the position (no exact criteria)
  const position = {
    x: options.point.x - struct.width / 2,
    y: options.point.y - 10,
  }
  const node = ctx.addNode(type, { position })
  if (!node || !options.insertion) return useDefaultState

  const { inputKey, outputKey } = event.data
  const nodeMap = ctx.getNodeMap()

  const inputProcessed = updateNodeInput(
    ctx.getGraphNodeModule,
    nodeMap,
    node.id,
    inputKey,
    options.insertion.outputId,
    options.insertion.outputKey
  )

  const outputProcessed = updateNodeInput(
    ctx.getGraphNodeModule,
    { ...nodeMap, ...inputProcessed },
    options.insertion.inputId,
    options.insertion.inputKey,
    node.id,
    outputKey
  )

  ctx.updateNodes({ ...inputProcessed, ...outputProcessed })
  return useDefaultState
}
