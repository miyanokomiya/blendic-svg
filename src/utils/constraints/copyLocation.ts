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

import { add, sub } from 'okageo'
import { Bone, IdMap, SpaceType } from '/@/models'
import {
  applyScale,
  getBoneWorldLocation,
  getBoneWorldTranslate,
  toBoneSpaceFn,
} from '/@/utils/geometry'

export interface Option {
  targetSpaceType: SpaceType
  ownerSpaceType: SpaceType
  targetId: string
  influence: number
  copyX: boolean
  copyY: boolean
  invertX: boolean
  invertY: boolean
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

  const parentWorldTranslate = boneMap[b.parentId]
    ? getBoneWorldTranslate(boneMap[b.parentId])
    : {
        x: 0,
        y: 0,
      }

  const targetLocation = applyScale(
    option.targetSpaceType === 'world'
      ? getBoneWorldLocation(target)
      : localMap[option.targetId]?.transform?.translate ?? { x: 0, y: 0 },
    {
      x: option.invertX ? -1 : 1,
      y: option.invertY ? -1 : 1,
    }
  )

  const ownerLocation =
    option.ownerSpaceType === 'world'
      ? getBoneWorldLocation(b)
      : localMap[boneId]?.transform?.translate ?? { x: 0, y: 0 }

  const diff = applyScale(sub(targetLocation, ownerLocation), {
    x: option.copyX ? option.influence : 0,
    y: option.copyY ? option.influence : 0,
  })

  const toSpaceFn = toBoneSpaceFn(b)

  return {
    ...boneMap,
    [boneId]: {
      ...b,
      transform: {
        ...b.transform,
        translate:
          option.ownerSpaceType === 'world'
            ? toSpaceFn.toLocal(sub(add(ownerLocation, diff), b.head))
            : add(add(ownerLocation, diff), parentWorldTranslate),
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
    copyX: true,
    copyY: true,
    invertX: false,
    invertY: false,
    ...src,
  }
}

export function getDependentCountMap(option: Option): IdMap<number> {
  return { [option.targetId]: 1 }
}
