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
import * as limitRotation from './limitRotation'
import { Bone, IdMap, toMap } from '/@/models'
import {
  dropMap,
  dropMapIfFalse,
  mapReduce,
  sumReduce,
  toList,
} from '/@/utils/commons'

export type BoneConstraintName = 'IK' | 'LIMIT_ROTATION'

export interface BoneConstraintOptions {
  IK: ik.Option
  LIMIT_ROTATION: limitRotation.Option
}

interface _BoneConstraint<N extends BoneConstraintName> {
  name: N
  option: BoneConstraintOptions[N]
}
export type BoneConstraint = _BoneConstraint<BoneConstraintName>
export type BoneConstraintOption = BoneConstraintOptions[BoneConstraintName]

export function CreateConstraint<N extends BoneConstraintName>(
  name: N,
  option: BoneConstraintOptions[N]
): _BoneConstraint<N> {
  return {
    name,
    option,
  }
}

function applyConstraint<N extends BoneConstraintName>(
  boneId: string,
  constraint: _BoneConstraint<N>,
  boneMap: IdMap<Bone>
): IdMap<Bone> {
  if (constraint.name === 'IK') {
    return ik.apply(
      boneId,
      constraint.option as BoneConstraintOptions['IK'],
      boneMap
    )
  } else {
    return boneMap
  }
}

export function applyBoneConstraints(
  posedMap: IdMap<Bone>,
  boneId: string
): IdMap<Bone> {
  const b = posedMap[boneId]
  if (!b) return posedMap

  return b.constraints.reduce((p, c) => {
    return {
      ...p,
      ...applyConstraint(b.id, c, p),
    }
  }, posedMap)
}

export function immigrateConstraints(
  duplicatedIdMap: IdMap<string>,
  constraints: BoneConstraint[]
): BoneConstraint[] {
  return constraints.map((src) => {
    return {
      ...src,
      option: immigrateOption(duplicatedIdMap, src.name, src.option),
    }
  })
}

function immigrateOption(
  duplicatedIdMap: IdMap<string>,
  name: BoneConstraintName,
  option: BoneConstraintOption
): BoneConstraintOption {
  switch (name) {
    case 'IK':
      return ik.immigrate(duplicatedIdMap, option as ik.Option)
    case 'LIMIT_ROTATION':
      return option
  }
}

export function getConstraintByName(
  name: BoneConstraintName,
  src: Partial<BoneConstraintOption> = {}
): BoneConstraint {
  return {
    name,
    option: getOptionByName(name, src),
  }
}

export function getOptionByName(
  name: BoneConstraintName,
  src: Partial<BoneConstraintOption> = {}
): BoneConstraintOption {
  switch (name) {
    case 'IK':
      return ik.getOption(src as ik.Option)
    case 'LIMIT_ROTATION':
      return limitRotation.getOption(src as limitRotation.Option)
  }
}

export function sortBoneByHighDependency(bones: Bone[]): Bone[] {
  const boneMap = toMap(bones)
  const dmap = getDependentCountMap(boneMap)
  const sortedIds = sortByDependency(dmap)
  return sortedIds.map((id) => boneMap[id])
}

function getDependentCountMap(boneMap: IdMap<Bone>): IdMap<IdMap<number>> {
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
  switch (constraint.name) {
    case 'IK':
      return ik.getDependentCountMap(constraint.option as ik.Option)
    case 'LIMIT_ROTATION':
      return limitRotation.getDependentCountMap(
        constraint.option as limitRotation.Option
      )
  }
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
    dropMapIfFalse(unresolved, (map) => {
      return Object.keys(map).every((key) => resolved[key])
    })
  )
}
