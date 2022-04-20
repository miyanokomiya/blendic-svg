import { IVec2 } from 'okageo'
import {
  EditMovement,
  PopupMenuItem,
  SelectOptions,
} from '/@/composables/modes/types'
import type {
  ModeStateBase,
  ModeStateContextBase,
} from '/@/composables/modeStates/core'
import { IdMap } from '/@/models'
import {
  GraphEdgeConnection,
  GraphNode,
  GraphNodeType,
} from '/@/models/graphNode'
import { GetGraphNodeModule, NODE_MENU_OPTION } from '/@/utils/graphNodes'

export interface AnimationGraphStateContext extends ModeStateContextBase {
  getGraphNodeModule: GetGraphNodeModule
  getNodeMap: () => IdMap<GraphNode>
  updateNodes: (val: IdMap<Partial<GraphNode>>) => void
  getSelectedNodeMap: () => IdMap<GraphNode>
  getLastSelectedNodeId: () => string | undefined
  selectedNodes: (ids: IdMap<boolean>, options?: SelectOptions) => void
  selectAllNode: () => void
  deleteNodes: () => void
  addNode: (type: GraphNodeType, position: IVec2) => void
  getEditMovement: () => EditMovement | undefined
  setEditMovement: (val?: EditMovement) => void
  getDraftEdge: () => DraftGraphEdge | undefined
  setDraftEdge: (val?: DraftGraphEdge) => void

  setPopupMenuList: (val?: { items: PopupMenuItem[]; point: IVec2 }) => void
  getNodeItemList: () => NODE_MENU_OPTION[]
}

export interface AnimationGraphState
  extends ModeStateBase<AnimationGraphStateContext> {}

export type DraftGraphEdge =
  | {
      type: 'draft-to'
      from: GraphEdgeConnection
      to: IVec2
    }
  | {
      type: 'draft-from'
      from: IVec2
      to: GraphEdgeConnection
    }
