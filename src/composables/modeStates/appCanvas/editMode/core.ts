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

import { add } from 'okageo'
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
import { Bone, BoneSelectedState, IdMap, toMap, Transform } from '/@/models'
import { AxisGridInfo } from '/@/store/canvas'
import { duplicateBones } from '/@/utils/armatures'
import { mapFilter, mapReduce, toList } from '/@/utils/commons'
import { BoneConstraint } from '/@/utils/constraints'

export interface EditStateContext extends CanvasStateContext {
  getBones: () => IdMap<Bone>
  getLastSelectedBoneId: () => string | undefined
  getSelectedBones: () => IdMap<BoneSelectedState>
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
  addBone: () => void
  addBones: (
    bones: Bone[],
    selectedState?: BoneSelectedState,
    constraints?: BoneConstraint[]
  ) => void
  updateBones: (diffMap: IdMap<Partial<Bone>>) => void
  deleteBones: () => void
  extrudeBones: () => void
  dissolveBones: () => void
  subdivideBones: () => void
  symmetrizeBones: () => void
  duplicateBones: () => void
  getDuplicateBones: () => {
    bones: Bone[]
    createdConstraints: BoneConstraint[]
  }

  setEditTransform: (val?: Transform, type?: CanvasCommand) => void
  completeEditTransform: () => void
  setAxisGridInfo: (val?: AxisGridInfo) => void
  getAxisGridInfo: () => AxisGridInfo | undefined

  setToolMenuGroups: (val?: ToolMenuGroup[]) => void
}

export interface EditState
  extends ModeStateBase<EditStateContext, AppCanvasEvent> {}

const clipboardSerializer = useClipboardSerializer<
  'bones',
  {
    bones: Bone[]
    createdConstraints: BoneConstraint[]
  }
>('bones')
export function useEditClipboard(ctx: EditStateContext) {
  return useClipboard(
    () => {
      const duplicated = ctx.getDuplicateBones()
      return {
        'text/plain': clipboardSerializer.serialize(duplicated),
      }
    },
    async (items) => {
      const item = items.find((i) => i.kind === 'string') as
        | StringItem
        | undefined
      if (!item) return

      const text: any = await item.getAsString()
      const restored = clipboardSerializer.deserialize(text)

      if (restored.bones.length > 0) {
        const bones = ctx.getBones()
        const names = toList(bones).map((b) => b.name)
        const renamed = duplicateBones(
          toMap(restored.bones),
          toMap(restored.createdConstraints),
          names
        )

        const origin = getBonesLeftTop(
          toList(
            mapReduce(
              mapFilter(ctx.getSelectedBones(), (s) => !!(s.head && s.tail)),
              (_, id) => bones[id]
            )
          )
        )
        const restoredOrigin = getBonesLeftTop(renamed.bones)
        const v = {
          x: origin[0] - restoredOrigin[0] + 20,
          y: origin[1] - restoredOrigin[1] + 20,
        }

        const slided = renamed.bones.map((b) => ({
          ...b,
          head: add(b.head, v),
          tail: add(b.tail, v),
        }))

        ctx.addBones(
          slided,
          { head: true, tail: true },
          renamed.createdConstraints
        )
      }
    }
  )
}

function getBonesLeftTop(bones: Bone[]): [left: number, top: number] {
  if (bones.length === 0) return [0, 0]

  const [head, ...body] = bones
  return body.reduce(
    (p, b) => {
      p[0] = Math.min(p[0], Math.min(b.head.x, b.tail.x))
      p[1] = Math.min(p[1], Math.min(b.head.y, b.tail.y))
      return p
    },
    [Math.min(head.head.x, head.tail.x), Math.min(head.head.y, head.tail.y)]
  )
}
