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

import { IVec2, rotate } from 'okageo'
import { PoseStateContext } from '/@/composables/modeStates/appCanvas/poseMode/core'
import { Bone, getTransform, IdMap, Transform } from '/@/models'
import { AxisGrid } from '/@/store/canvas'
import {
  getSelectedBonesOrigin,
  getWorldToLocalTranslateFn,
  posedTransform,
} from '/@/utils/armatures'
import { mapReduce } from '/@/utils/commons'
import { getBoneXRadian } from '/@/utils/geometry'

export function getLastSelectedBoneSpace(
  ctx: Pick<PoseStateContext, 'getLastSelectedBoneId' | 'getBones'>
): {
  origin: IVec2
  radian: number
} {
  const targetId = ctx.getLastSelectedBoneId()
  if (!targetId) return { origin: { x: 0, y: 0 }, radian: 0 }

  const boneMap = ctx.getBones()
  const bone = boneMap[targetId]

  const posedParent = bone.parentId ? boneMap[bone.parentId] : undefined
  const parentRotate = posedParent?.transform.rotate ?? 0

  return {
    origin: posedTransform(bone, [bone.transform]).head,
    radian: getBoneXRadian(bone) + (parentRotate * Math.PI) / 180,
  }
}

export function handleToggleAxisGrid(
  ctx: Pick<
    PoseStateContext,
    | 'getAxisGridInfo'
    | 'setAxisGridInfo'
    | 'getLastSelectedBoneId'
    | 'getBones'
    | 'getSelectedBones'
  >,
  axis: AxisGrid
) {
  const unitV = axis === 'x' ? { x: 1, y: 0 } : { x: 0, y: 1 }
  if (ctx.getAxisGridInfo()?.axis === axis) {
    if (ctx.getAxisGridInfo()?.local) {
      ctx.setAxisGridInfo()
    } else {
      const boneSpace = getLastSelectedBoneSpace(ctx)
      ctx.setAxisGridInfo({
        axis,
        local: true,
        vec: rotate(unitV, boneSpace.radian),
        origin: boneSpace.origin,
      })
    }
  } else {
    ctx.setAxisGridInfo({
      axis,
      local: false,
      vec: unitV,
      origin: getSelectedBonesOrigin(
        ctx.getBones(),
        mapReduce(ctx.getSelectedBones(), () => ({ head: true }))
      ),
    })
  }
}

export function handleToggleAxisGridLocal(
  ctx: Pick<
    PoseStateContext,
    'getAxisGridInfo' | 'setAxisGridInfo' | 'getLastSelectedBoneId' | 'getBones'
  >,
  axis: AxisGrid
) {
  if (ctx.getAxisGridInfo()?.axis === axis) {
    ctx.setAxisGridInfo()
  } else {
    const unitV = axis === 'x' ? { x: 1, y: 0 } : { x: 0, y: 1 }
    const boneSpace = getLastSelectedBoneSpace(ctx)
    ctx.setAxisGridInfo({
      axis,
      local: true,
      vec: rotate(unitV, boneSpace.radian),
      origin: boneSpace.origin,
    })
  }
}

export function getDefaultEditTransform(arg: Partial<Transform> = {}) {
  return getTransform({ scale: { x: 0, y: 0 }, ...arg })
}

export function convertToPosedSpace(
  vec: IVec2,
  boneMap: IdMap<Bone>,
  boneId: string
): IVec2 {
  const bone = boneMap[boneId]
  const parent = boneMap[bone.parentId]
  const worldToLocalFn = getWorldToLocalTranslateFn(bone, parent?.transform)
  return worldToLocalFn(vec)
}
