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
import { Bone, IdMap } from '/@/models'

export type BoneConstraintName = 'IK' | 'LIMIT_ROTATION'

export interface BoneConstraintOptions {
  IK: ik.Option
  LIMIT_ROTATION: { min: number; max: number; influence: number }
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

export function applyConstraint<N extends BoneConstraintName>(
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

export function applyAllConstraints(posedMap: IdMap<Bone>): IdMap<Bone> {
  let appliedMap = posedMap
  Object.keys(appliedMap).forEach((id) => {
    const b = appliedMap[id]
    appliedMap = b.constraints.reduce((p, c) => {
      return {
        ...p,
        ...applyConstraint(b.id, c, appliedMap),
      }
    }, appliedMap)
  })
  return appliedMap
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
