import { EditMovement } from '/@/composables/modes/types'
import type {
  ModeStateBase,
  ModeStateContextBase,
} from '/@/composables/modeStates/core'
import { IdMap } from '/@/models'
import { GraphNode } from '/@/models/graphNode'

export interface AnimationGraphStateContext extends ModeStateContextBase {
  getEditMovement: () => EditMovement | undefined
  setEditMovement: (val?: EditMovement) => void
  updateNodes: (val: IdMap<Partial<GraphNode>>) => void
  getSelectedNodeMap: () => IdMap<GraphNode>
}

export interface AnimationGraphState
  extends ModeStateBase<AnimationGraphStateContext> {}
