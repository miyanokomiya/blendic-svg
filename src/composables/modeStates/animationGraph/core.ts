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
import {
  EditMovement,
  SelectOptions,
  ToolMenuGroup,
} from '/@/composables/modes/types'
import type {
  ModeStateBase,
  ModeStateEvent,
  ModeStateEventBase,
  TransitionValue,
} from '/@/composables/modeStates/core'
import { IdMap } from '/@/models'
import { CanvasStateContext } from '/@/composables/modeStates/commons'
import {
  EdgeSummary,
  GraphEdgeConnection,
  GraphNode,
  GraphNodeType,
} from '/@/models/graphNode'
import { GetGraphNodeModule, NODE_MENU_OPTION } from '/@/utils/graphNodes'

export interface AnimationGraphStateContext extends CanvasStateContext {
  startEditMovement: () => void
  getCursorPoint: () => IVec2
  getEditMovement: () => EditMovement | undefined
  setEditMovement: (val?: EditMovement) => void
  getGraphNodeModule: GetGraphNodeModule
  getNodeMap: () => IdMap<GraphNode>
  updateNodes: (val: IdMap<Partial<GraphNode>>) => void
  getSelectedNodeMap: () => IdMap<GraphNode>
  getLastSelectedNodeId: () => string | undefined
  selectNodes: (ids: IdMap<boolean>, options?: SelectOptions) => void
  selectAllNode: () => void
  deleteNodes: () => void
  addNode: (
    type: GraphNodeType,
    arg?: Partial<GraphNode>
  ) => GraphNode | undefined
  pasteNodes: (val: GraphNode[]) => void
  getDraftEdge: () => DraftGraphEdge | undefined
  setDraftEdge: (val?: DraftGraphEdge) => void
  makeCustomGraphFromSelectedNodes: () => void

  getNodeItemList: () => NODE_MENU_OPTION[]

  setEdgeCutter: (val: EdgeCutter | undefined) => void
  getEdgeCutter: () => EdgeCutter | undefined
  getEdgeSummaryMap: () => IdMap<IdMap<EdgeSummary>>
  setToolMenuList: (val?: ToolMenuGroup[]) => void
}

export interface AnimationGraphState
  extends ModeStateBase<AnimationGraphStateContext, AnimationGraphEvent> {}

export type AnimationGraphEvent = ModeStateEvent | ChangeSelectionEvent

export type AnimationGraphTransitionValue = TransitionValue<
  AnimationGraphStateContext,
  AnimationGraphEvent
>

export interface ChangeSelectionEvent extends ModeStateEventBase {
  type: 'selection'
}

export type DraftGraphEdge =
  | {
      type: 'draft-input'
      output: GraphEdgeConnection
      input: IVec2
    }
  | {
      type: 'draft-output'
      output: IVec2
      inputs: GraphEdgeConnection[]
    }

export type EdgeCutter = {
  from: IVec2
  to: IVec2
}
