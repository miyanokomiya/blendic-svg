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

export interface Option {
  spaceType: SpaceType
  min: number
  max: number
  influence: number
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
    return {
      ...boneMap,
      [boneId]: {
        ...b,
        transform: {
          ...b.transform,
          rotate: limitRotation(
            option.min,
            option.max,
            option.influence,
            b.transform.rotate
          ),
        },
      },
    }
  } else if (option.spaceType === 'local') {
    const localRotate = limitRotation(
      option.min,
      option.max,
      option.influence,
      localMap[boneId].transform.rotate
    )
    return {
      ...boneMap,
      [boneId]: {
        ...b,
        transform: {
          ...b.transform,
          rotate: b.inheritRotation
            ? localRotate + boneMap[b.parentId]?.transform.rotate ?? 0
            : localRotate,
        },
      },
    }
  }
  return boneMap
}

function limitRotation(
  min: number,
  max: number,
  influence: number,
  current: number
): number {
  const limited = Math.min(Math.max(current, min), max)
  const diff = limited - current
  return current + diff * influence
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
    min: 0,
    max: 0,
    influence: 1,
    ...src,
  }
}

export function getDependentCountMap(_option: Option): IdMap<number> {
  return {}
}
