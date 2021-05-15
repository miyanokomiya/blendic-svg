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

import * as ik from './ik'
import * as limitLocation from './limitLocation'
import * as limitRotation from './limitRotation'
import * as limitScale from './limitScale'
import * as copyRotation from './copyRotation'
import * as copyLocation from './copyLocation'
import * as copyScale from './copyScale'
import { Bone, IdMap, toMap } from '/@/models'
import { dropMap, mapFilter, mapReduce, sumReduce } from '/@/utils/commons'
import { v4 } from 'uuid'

export type BoneConstraintType =
  | 'IK'
  | 'LIMIT_LOCATION'
  | 'LIMIT_ROTATION'
  | 'LIMIT_SCALE'
  | 'COPY_LOCATION'
  | 'COPY_ROTATION'
  | 'COPY_SCALE'

export interface BoneConstraintOptions {
  IK: ik.Option
  LIMIT_LOCATION: limitLocation.Option
  LIMIT_ROTATION: limitRotation.Option
  LIMIT_SCALE: limitScale.Option
  COPY_LOCATION: copyLocation.Option
  COPY_ROTATION: copyRotation.Option
  COPY_SCALE: copyScale.Option
}

export type BoneConstraintOption =
  BoneConstraintOptions[keyof BoneConstraintOptions] & {
    influence: number
  }

interface _BoneConstraint<N extends BoneConstraintType> {
  id: string
  type: N
  name: string
  option: BoneConstraintOption
}
export type BoneConstraint = _BoneConstraint<BoneConstraintType>

export type BoneConstraintWithBoneId = BoneConstraint & { boneId: string }

interface BoneConstraintModule {
  apply(
    boneId: string,
    option: any,
    localMap: IdMap<Bone>,
    boneMap: IdMap<Bone>
  ): IdMap<Bone>
  immigrate(duplicatedIdMap: IdMap<string>, option: any): any
  getOption(src: Partial<any>): any
  getDependentCountMap(option: BoneConstraintOption): IdMap<number>
}

function getConstraintModule(type: BoneConstraintType): BoneConstraintModule {
  switch (type) {
    case 'IK':
      return ik
    case 'LIMIT_LOCATION':
      return limitLocation
    case 'LIMIT_ROTATION':
      return limitRotation
    case 'LIMIT_SCALE':
      return limitScale
    case 'COPY_LOCATION':
      return copyLocation
    case 'COPY_ROTATION':
      return copyRotation
    case 'COPY_SCALE':
      return copyScale
  }
}

function applyConstraint(
  localMap: IdMap<Bone>,
  boneMap: IdMap<Bone>,
  constraint: BoneConstraint,
  boneId: string
): IdMap<Bone> {
  return getConstraintModule(constraint.type).apply(
    boneId,
    constraint.option,
    localMap,
    boneMap
  )
}

export function applyBoneConstraints(
  localMap: IdMap<Bone>,
  posedMap: IdMap<Bone>,
  boneId: string
): IdMap<Bone> {
  const b = posedMap[boneId]
  if (!b) return posedMap

  return b.constraints.reduce((p, c) => {
    return {
      ...p,
      ...applyConstraint(localMap, p, c, b.id),
    }
  }, posedMap)
}

export function immigrateConstraints(
  duplicatedIdMap: IdMap<string>,
  constraints: BoneConstraint[],
  getId: (src: BoneConstraint) => string = (src) => src.id
): BoneConstraint[] {
  return constraints.map((src) => {
    return {
      ...src,
      id: getId(src),
      option: immigrateOption(duplicatedIdMap, src.type, src.option),
    }
  })
}

function immigrateOption(
  duplicatedIdMap: IdMap<string>,
  type: BoneConstraintType,
  option: BoneConstraintOption
): BoneConstraintOption {
  return getConstraintModule(type).immigrate(duplicatedIdMap, option)
}

export function getConstraint(
  src: {
    id?: string
    type: BoneConstraintType
    name?: string
    option?: Partial<BoneConstraintOption>
  },
  generateId = false
): BoneConstraint {
  const id = generateId ? v4() : src.id ?? ''
  return {
    type: src.type,
    name: src?.name ?? '',
    option: getOptionByType(src.type, src?.option),
    id,
  }
}

export function getOptionByType(
  type: BoneConstraintType,
  src: Partial<BoneConstraintOption> = {}
): BoneConstraintOption {
  return getConstraintModule(type).getOption(src)
}

export function sortBoneByHighDependency(bones: Bone[]): Bone[] {
  const boneMap = toMap(bones)
  const dmap = getDependentCountMap(boneMap)
  const sortedIds = sortByDependency(dmap)
  return sortedIds.map((id) => boneMap[id])
}

export function getDependentCountMap(
  boneMap: IdMap<Bone>
): IdMap<IdMap<number>> {
  return mapReduce(boneMap, (b) => {
    return sumReduce(
      b.constraints.map(getDependentCountMapOfConstrain).concat(
        b.parentId
          ? {
              [b.parentId]: 1,
            }
          : {}
      )
    )
  })
}

function getDependentCountMapOfConstrain(
  constraint: BoneConstraint
): IdMap<number> {
  return getConstraintModule(constraint.type).getDependentCountMap(
    constraint.option
  )
}

export function sortByDependency(map: IdMap<IdMap<number>>): string[] {
  let ret: string[] = []
  let resolved: IdMap<boolean> = {}
  let unresolved = map
  while (Object.keys(unresolved).length > 0) {
    const keys = sortByDependencyStep(resolved, unresolved)
    if (keys.length === 0) {
      ret = ret.concat(Object.keys(unresolved).sort())
      break
    }
    ret = ret.concat(keys)
    ;(resolved = keys.reduce((p, c) => ({ ...p, [c]: true }), resolved)),
      (unresolved = dropMap(unresolved, resolved))
  }
  return ret
}

function sortByDependencyStep(
  resolved: IdMap<boolean>,
  unresolved: IdMap<IdMap<number>>
): string[] {
  return Object.keys(
    mapFilter(unresolved, (map) => {
      return Object.keys(map).every((key) => resolved[key])
    })
  )
}
