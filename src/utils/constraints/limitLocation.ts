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

import { add, multi, sub } from 'okageo'
import { Bone, IdMap, SpaceType } from '/@/models'
import {
  applyPosedTransformToPoint,
  clamp,
  getBoneWorldLocation,
} from '/@/utils/geometry'

export interface Option {
  spaceType: SpaceType
  influence: number
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export function apply(
  boneId: string,
  option: Option,
  localMap: IdMap<Bone>,
  boneMap: IdMap<Bone>
): IdMap<Bone> {
  const b = boneMap[boneId]
  if (!b) return boneMap
  if (b.connected) return boneMap

  if (option.spaceType === 'world') {
    const ownerLocation = getBoneWorldLocation(b)
    const targetLocation = {
      x: clamp(option.minX, option.maxX, ownerLocation.x),
      y: clamp(option.minY, option.maxY, ownerLocation.y),
    }
    const diff = multi(sub(targetLocation, ownerLocation), option.influence)

    return {
      ...boneMap,
      [boneId]: {
        ...b,
        transform: {
          ...b.transform,
          translate: sub(add(ownerLocation, diff), b.head),
        },
      },
    }
  } else {
    const localB = localMap[boneId]
    if (!localB) return boneMap

    const ownerTranslate = localB.transform.translate
    const targetLocation = {
      x: clamp(option.minX, option.maxX, ownerTranslate.x),
      y: clamp(option.minY, option.maxY, ownerTranslate.y),
    }
    const diff = multi(sub(targetLocation, ownerTranslate), option.influence)
    const nextLocalTranslate = add(ownerTranslate, diff)

    // recalc extended translation
    const posedHead = add(localB.head, nextLocalTranslate)
    const extendedPosedHead = boneMap[b.parentId]
      ? applyPosedTransformToPoint(boneMap[b.parentId], posedHead)
      : posedHead
    const headDiff = sub(extendedPosedHead, posedHead)

    return {
      ...boneMap,
      [boneId]: {
        ...b,
        transform: {
          ...b.transform,
          translate: add(nextLocalTranslate, headDiff),
        },
      },
    }
  }
}

export function immigrate(
  _duplicatedIdMap: IdMap<string>,
  option: Option
): Option {
  return option
}

export function getOption(src: Partial<Option> = {}): Option {
  return {
    spaceType: 'world',
    influence: 1,
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    ...src,
  }
}

export function getDependentCountMap(_option: Option): IdMap<number> {
  return {}
}
