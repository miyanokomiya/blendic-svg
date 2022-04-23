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
          const [type, key] = event.data.key.split('.')
          const node = ctx.addNode(type, { position: options.point })

          const draft = ctx.getDraftEdge()
          if (node && draft && key) {
            const nodeMap = ctx.getNodeMap()
            if (draft.type === 'draft-to') {
              ctx.updateNodes(
                updateNodeInput(
                  ctx.getGraphNodeModule,
                  nodeMap,
                  nodeMap[node.id],
                  key,
                  draft.from.nodeId,
                  draft.from.key
                )
              )
            } else {
              ctx.updateNodes(
                updateNodeInput(
                  ctx.getGraphNodeModule,
                  nodeMap,
                  nodeMap[draft.to.nodeId],
                  draft.to.key,
                  node.id,
                  key
                )
              )
            }
          }
          return useDefaultState
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
    const forOutput = draft.type === 'draft-to'
    const edge = forOutput ? draft.from : draft.to
    const point = forOutput ? draft.to : draft.from
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
