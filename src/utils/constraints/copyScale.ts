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
import { applyScale } from '/@/utils/geometry'

export interface Option {
  targetSpaceType: SpaceType
  ownerSpaceType: SpaceType
  targetId: string
  influence: number
  power: number
  copyX: boolean
  copyY: boolean
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

  const parentScale = boneMap[b.parentId]?.transform.scale ?? {
    x: 1,
    y: 1,
  }

  const targetScale =
    option.targetSpaceType === 'world'
      ? target.transform.scale
      : localMap[option.targetId]?.transform?.scale ?? { x: 1, y: 1 }

  const ownerScale =
    option.ownerSpaceType === 'world'
      ? b.transform.scale
      : localMap[boneId]?.transform?.scale ?? { x: 1, y: 1 }

  const diff = applyScale(
    sub(
      {
        x: Math.pow(targetScale.x, option.power),
        y: Math.pow(targetScale.y, option.power),
      },
      ownerScale
    ),
    {
      x: option.copyX ? option.influence : 0,
      y: option.copyY ? option.influence : 0,
    }
  )

  return {
    ...boneMap,
    [boneId]: {
      ...b,
      transform: {
        ...b.transform,
        scale:
          option.ownerSpaceType === 'world'
            ? add(ownerScale, diff)
            : applyScale(add(ownerScale, diff), parentScale),
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
    power: 1,
    copyX: true,
    copyY: true,
    ...src,
  }
}

export function getDependentCountMap(option: Option): IdMap<number> {
  return { [option.targetId]: 1 }
}
