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

Copyright (C) 2021, Tomoya Komiyama.
*/

import { add, getRadian, IVec2, rotate, sub } from 'okageo'
import { getParentIdPath } from '../commons'
import { Bone, getTransform, IdMap, toMap, Transform } from '/@/models'

export interface Option {
  targetId: string
  poleTargetId: string
  iterations: number
  chainLength: number
}

export function apply(
  boneId: string,
  option: Option,
  boneMap: IdMap<Bone>
): IdMap<Bone> {
  const bones = getIKBones(boneId, option, boneMap)
  const target = boneMap[option.targetId]

  let applied = bones
  for (let i = 0; i < option.iterations; i++) {
    applied = step(target.head, applied)
  }

  return {
    ...boneMap,
    ...toMap(applied),
  }
}

function getIKBones(
  boneId: string,
  option: Option,
  boneMap: IdMap<Bone>
): Bone[] {
  if (option.chainLength === 0) return []

  const allPath = [
    ...getParentIdPath(boneMap, boneId).map((id) => boneMap[id]),
    boneMap[boneId],
  ]
  return allPath.slice(-option.chainLength)
}

function step(targetPoint: IVec2, bones: Bone[]): Bone[] {
  if (bones.length === 0) return bones

  let currentTargetPoint = targetPoint
  const stickedList = bones
    .concat()
    .reverse()
    .map((b) => {
      const stickInfo = getStickInfoTarget(currentTargetPoint, b)
      currentTargetPoint = add(b.head, stickInfo.translate)
      return {
        ...b,
        transform: {
          ...b.transform,
          rotate: stickInfo.rotate,
          translate: stickInfo.translate,
        },
      }
    })
    .reverse()

  const stickRootVec = sub(bones[0].head, stickedList[0].transform.translate)
  return stickedList.map((b) => ({
    ...b,
    transform: {
      ...b.transform,
      translate: add(b.transform.translate, stickRootVec),
    },
  }))
}

function getStickInfoTarget(
  targetPoint: IVec2,
  bone: Bone
): { rotate: number; translate: IVec2 } {
  const head = add(bone.head, bone.transform.translate)
  const tail = add(bone.tail, bone.transform.translate)
  const rad = getRadian(targetPoint, head)
  const rotatedTail = rotate(tail, rad, head)
  return {
    rotate: (rad / Math.PI) * 180,
    translate: add(bone.transform.translate, sub(targetPoint, rotatedTail)),
  }
}
