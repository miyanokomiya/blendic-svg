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

import { add, IVec2, multi, sub } from 'okageo'
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
  useMinX: boolean
  useMaxX: boolean
  useMinY: boolean
  useMaxY: boolean
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
    const diff = limitLocationDiff(option, ownerLocation)

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
    const diff = limitLocationDiff(option, ownerTranslate)
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

function limitLocationDiff(option: Option, location: IVec2): IVec2 {
  const targetLocation = {
    x: clamp(
      option.useMinX ? option.minX : undefined,
      option.useMaxX ? option.maxX : undefined,
      location.x
    ),
    y: clamp(
      option.useMinY ? option.minY : undefined,
      option.useMaxY ? option.maxY : undefined,
      location.y
    ),
  }
  return multi(sub(targetLocation, location), option.influence)
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
    useMinX: false,
    useMaxX: false,
    useMinY: false,
    useMaxY: false,
    ...src,
  }
}

export function getDependentCountMap(_option: Option): IdMap<number> {
  return {}
}
