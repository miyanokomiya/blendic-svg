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

import { Bone, IdMap, SpaceType } from '/@/models'
import { getBoneBodyRotation, getBoneWorldRotation } from '/@/utils/geometry'

export interface Option {
  targetSpaceType: SpaceType
  ownerSpaceType: SpaceType
  targetId: string
  influence: number
  invert: boolean
}

export function apply(
  boneId: string,
  option: Option,
  localMap: IdMap<Bone>,
  boneMap: IdMap<Bone>
): IdMap<Bone> {
  const target = boneMap[option.targetId]
  const b = boneMap[boneId]
  if (!target || !b) return boneMap

  const parentRotate = b.inheritRotation
    ? boneMap[b.parentId]?.transform.rotate ?? 0
    : 0

  const targetRotate =
    (option.targetSpaceType === 'world'
      ? getBoneWorldRotation(target)
      : localMap[option.targetId]?.transform?.rotate ?? 0) *
    (option.invert ? -1 : 1)

  const ownerRotate =
    option.ownerSpaceType === 'world'
      ? getBoneWorldRotation(b)
      : localMap[boneId]?.transform?.rotate ?? 0

  const diff = (targetRotate - ownerRotate) * option.influence

  return {
    ...boneMap,
    [boneId]: {
      ...b,
      transform: {
        ...b.transform,
        rotate:
          option.ownerSpaceType === 'world'
            ? ownerRotate + diff - getBoneBodyRotation(b)
            : ownerRotate + diff + parentRotate,
      },
    },
  }
}

export function immigrate(
  duplicatedIdMap: IdMap<string>,
  option: Option
): Option {
  return {
    ...option,
    targetId: duplicatedIdMap[option.targetId] ?? option.targetId,
  }
}

export function getOption(src: Partial<Option> = {}): Option {
  return {
    targetSpaceType: 'world',
    ownerSpaceType: 'world',
    targetId: '',
    influence: 1,
    invert: false,
    ...src,
  }
}

export function getDependentCountMap(option: Option): IdMap<number> {
  return { [option.targetId]: 1 }
}
