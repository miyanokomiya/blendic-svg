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
import { clamp, getBoneWorldLocation } from '/@/utils/geometry'

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

  const parentTranslate = boneMap[b.parentId]?.transform.translate ?? {
    x: 0,
    y: 0,
  }

  const ownerLocation =
    option.spaceType === 'world'
      ? getBoneWorldLocation(b)
      : localMap[boneId]?.transform?.translate ?? { x: 0, y: 0 }

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
        translate:
          option.spaceType === 'world'
            ? sub(add(ownerLocation, diff), b.head)
            : add(add(ownerLocation, diff), parentTranslate),
      },
    },
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
