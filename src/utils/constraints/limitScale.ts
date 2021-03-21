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
import { applyScale, clamp } from '/@/utils/geometry'

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

  if (option.spaceType === 'world') {
    const ownerScale = b.transform.scale
    const diff = limitScaleDiff(option, ownerScale)

    return {
      ...boneMap,
      [boneId]: {
        ...b,
        transform: {
          ...b.transform,
          scale: add(ownerScale, diff),
        },
      },
    }
  } else {
    const localB = localMap[boneId]
    if (!localB) return boneMap

    const ownerScale = localB.transform.scale
    const diff = limitScaleDiff(option, ownerScale)
    const parentScale =
      b.inheritScale && boneMap[b.parentId]
        ? boneMap[b.parentId].transform.scale
        : { x: 1, y: 1 }

    return {
      ...boneMap,
      [boneId]: {
        ...b,
        transform: {
          ...b.transform,
          scale: applyScale(add(ownerScale, diff), parentScale),
        },
      },
    }
  }
}

function limitScaleDiff(option: Option, scale: IVec2): IVec2 {
  const targetScale = {
    x: clamp(
      option.useMinX ? option.minX : undefined,
      option.useMaxX ? option.maxX : undefined,
      scale.x
    ),
    y: clamp(
      option.useMinY ? option.minY : undefined,
      option.useMaxY ? option.maxY : undefined,
      scale.y
    ),
  }
  return multi(sub(targetScale, scale), option.influence)
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
