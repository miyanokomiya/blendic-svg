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

import {
  StringItem,
  useClipboard,
  useClipboardSerializer,
} from '/@/composables/clipboard'
import {
  CanvasCommand,
  SelectOptions,
  ToolMenuGroup,
} from '/@/composables/modes/types'
import { AppCanvasEvent } from '/@/composables/modeStates/appCanvas/core'
import { CanvasStateContext } from '/@/composables/modeStates/commons'
import type { ModeStateBase } from '/@/composables/modeStates/core'
import { Bone, BoneSelectedState, IdMap, Transform } from '/@/models'
import { AxisGridInfo } from '/@/store/canvas'
import { mapReduce } from '/@/utils/commons'

export interface PoseStateContext extends CanvasStateContext {
  getBones: () => IdMap<Bone>
  getLastSelectedBoneId: () => string | undefined
  /**
   * Returns only selected index bones in the tree
   * eg) When a bone and its parent are selected, this method returns only the parent
   */
  getSelectedBones: () => IdMap<Bone>
  selectBone: (
    id?: string,
    selectedState?: BoneSelectedState,
    options?: SelectOptions,
    ignoreConnection?: boolean
  ) => void
  selectBones: (
    selectedStateMap: IdMap<BoneSelectedState>,
    shift?: boolean
  ) => void
  selectAllBones: () => void

  setEditTransforms: (val?: IdMap<Transform>, type?: CanvasCommand) => void
  completeEditTransforms: () => void
  setAxisGridInfo: (val?: AxisGridInfo) => void
  getAxisGridInfo: () => AxisGridInfo | undefined
  insertKeyframe: (options?: {
    translateX?: boolean
    translateY?: boolean
    rotate?: boolean
    scaleX?: boolean
    scaleY?: boolean
  }) => void
  pastePoses: (val: IdMap<Transform>) => void

  setToolMenuGroups: (val?: ToolMenuGroup[]) => void
}

export interface PoseState
  extends ModeStateBase<PoseStateContext, AppCanvasEvent> {}

const clipboardSerializer = useClipboardSerializer<
  'bone-poses',
  IdMap<Transform>
>('bone-poses')
export function usePoseClipboard(ctx: PoseStateContext) {
  return useClipboard(
    () => {
      return {
        'text/plain': clipboardSerializer.serialize(
          mapReduce(ctx.getBones(), (b) => b.transform)
        ),
      }
    },
    async (items) => {
      const item = items.find((i) => i.kind === 'string') as
        | StringItem
        | undefined
      if (!item) return

      const text: any = await item.getAsString()
      const restored = clipboardSerializer.deserialize(text)
      if (Object.keys(restored).length > 0) {
        ctx.pastePoses(restored)
      }
    }
  )
}
