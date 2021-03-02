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

export interface BoneConstraintOption {
  IK: ik.Option
  LIMIT_ROTATION: { min: number; max: number; influence: number }
}

export interface BoneConstraint<N extends BoneConstraintName> {
  name: N
  option: BoneConstraintOption[N]
}

export function CreateConstraint<N extends BoneConstraintName>(
  name: N,
  option: BoneConstraintOption[N]
): BoneConstraint<N> {
  return {
    name,
    option,
  }
}

export function applyConstraint<N extends BoneConstraintName>(
  boneId: string,
  constraint: BoneConstraint<N>,
  boneMap: IdMap<Bone>
): IdMap<Bone> {
  if (constraint.name === 'IK') {
    return ik.apply(
      boneId,
      constraint.option as BoneConstraintOption['IK'],
      boneMap
    )
  } else {
    return boneMap
  }
}
