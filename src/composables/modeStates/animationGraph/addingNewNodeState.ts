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

type Option = {
  point: IVec2
  connect?:
    | { nodeId: string; inputKey: string }
    | { nodeId: string; outputKey: string }
}

export function useAddingNewNodeState(options: Option): AnimationGraphState {
  return {
    getLabel: () => 'AddingNewNodeState',
    onStart: async (ctx) => {
      setupPopupMenuListForEdge(ctx, options)
    },
    onEnd: async (ctx) => {
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
          if (node && options.connect && key) {
            const nodeMap = ctx.getNodeMap()
            if ('inputKey' in options.connect) {
              ctx.updateNodes(
                updateNodeInput(
                  ctx.getGraphNodeModule,
                  nodeMap,
                  nodeMap[options.connect.nodeId],
                  options.connect.inputKey,
                  node.id,
                  key
                )
              )
            } else {
              ctx.updateNodes(
                updateNodeInput(
                  ctx.getGraphNodeModule,
                  nodeMap,
                  nodeMap[node.id],
                  key,
                  options.connect.nodeId,
                  options.connect.outputKey
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
  options: Option
) {
  if (options.connect) {
    const struct = ctx.getGraphNodeModule(
      ctx.getNodeMap()[options.connect.nodeId].type
    )?.struct
    const node = ctx.getNodeMap()[options.connect.nodeId]
    const suggestions =
      'inputKey' in options.connect
        ? getNodeSuggestionMenuOptions(
            ctx.getGraphNodeModule,
            ctx.getNodeItemList(),
            getInputType(struct, node, options.connect.inputKey)
          )
        : getNodeSuggestionMenuOptions(
            ctx.getGraphNodeModule,
            ctx.getNodeItemList(),
            getOutputType(struct, node, options.connect.outputKey),
            true
          )
    const items: PopupMenuItem[] = suggestions.map(({ label, children }) => ({
      label,
      children: children.map(({ label, type, key }) => ({
        label,
        key: `${type}.${key}`,
      })),
    }))
    ctx.setPopupMenuList({ point: options.point, items })
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
