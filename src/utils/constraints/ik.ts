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

import { add, getRadian, IVec2, multi, rotate, sub } from 'okageo'
import { getParentIdPath, sumReduce } from '../commons'
import { Bone, IdMap, toMap } from '/@/models'
import { interpolateTransform } from '/@/utils/armatures'

export interface Option {
  targetId: string
  poleTargetId: string
  iterations: number
  chainLength: number
  influence: number
}

export function apply(
  boneId: string,
  option: Option,
  _localMap: IdMap<Bone>,
  boneMap: IdMap<Bone>
): IdMap<Bone> {
  const target = boneMap[option.targetId]
  if (!target) return boneMap

  const bones = getIKBones(boneId, option, boneMap)
  const poleTarget = boneMap[option.poleTargetId]
  const targetPoint = add(target.head, target.transform.translate)

  let applied = poleTarget
    ? straightToPoleTarget(
        add(poleTarget.head, poleTarget.transform.translate),
        bones
      )
    : bones
  for (let i = 0; i < option.iterations; i++) {
    applied = step(targetPoint, applied)
  }

  applied = applied.map((dist, i) => {
    const src = bones[i]
    return {
      ...dist,
      transform: interpolateTransform(
        src.transform,
        dist.transform,
        option.influence
      ),
    }
  })

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

  const diff = sub(
    bones[0].transform.translate,
    stickedList[0].transform.translate
  )
  return stickedList.map((b) => ({
    ...b,
    transform: {
      ...b.transform,
      translate: add(b.transform.translate, diff),
    },
  }))
}

function getScaledTail(bone: Bone): IVec2 {
  return add(
    bone.head,
    multi(sub(bone.tail, bone.head), bone.transform.scale.y)
  )
}

function getStickInfoTarget(
  targetPoint: IVec2,
  bone: Bone
): { rotate: number; translate: IVec2 } {
  const head = add(bone.head, bone.transform.translate)
  const tail = add(getScaledTail(bone), bone.transform.translate)
  const rad = getRadian(targetPoint, head) - getRadian(tail, head)
  const rotatedTail = rotate(tail, rad, head)
  return {
    rotate: (rad / Math.PI) * 180,
    translate: add(bone.transform.translate, sub(targetPoint, rotatedTail)),
  }
}

export function straightToPoleTarget(
  poleTargetPoint: IVec2,
  bones: Bone[]
): Bone[] {
  if (bones.length === 0) return bones

  const root = bones[0]
  const rad = getRadian(
    poleTargetPoint,
    add(root.head, root.transform.translate)
  )
  let parent = root
  let parentTailTranslate = { x: 0, y: 0 }
  return bones.map((b) => {
    const head = add(b.head, b.transform.translate)
    const tail = add(b.tail, b.transform.translate)
    const selfRad = rad - getRadian(tail, head)
    const angle = (selfRad / Math.PI) * 180
    const next = {
      ...b,
      transform: {
        ...b.transform,
        rotate: angle,
        translate: add(b.transform.translate, parentTailTranslate),
      },
    }
    parent = next
    parentTailTranslate = sub(
      rotate(parent.tail, selfRad, parent.head),
      parent.tail
    )
    return next
  })
}

export function immigrate(
  duplicatedIdMap: IdMap<string>,
  option: Option
): Option {
  return {
    ...option,
    targetId: duplicatedIdMap[option.targetId] ?? option.targetId,
    poleTargetId: duplicatedIdMap[option.poleTargetId] ?? option.poleTargetId,
  }
}

export function getOption(src: Partial<Option> = {}): Option {
  return {
    targetId: '',
    poleTargetId: '',
    iterations: 20,
    chainLength: 2,
    influence: 1,
    ...src,
  }
}

export function getDependentCountMap(option: Option): IdMap<number> {
  return sumReduce([
    option.targetId ? { [option.targetId]: 1 } : {},
    option.poleTargetId ? { [option.poleTargetId]: 1 } : {},
  ])
}
