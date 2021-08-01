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

import { v4 } from 'uuid'
import { BoneConstraint, BoneConstraintType } from '/@/utils/constraints'

export function migrateConstraint(src: BoneConstraint): BoneConstraint {
  return migrateConstraint6(migrateConstraint5(migrateConstraint4(src)))
}

export function migrateConstraint4(
  src: Omit<BoneConstraint, 'type' | 'id'> & {
    type?: BoneConstraintType
  }
): Omit<BoneConstraint, 'id'> {
  if (src.type) return src as BoneConstraint
  return {
    type: src.name as BoneConstraintType,
    name: src.name,
    option: src.option,
  }
}

export function migrateConstraint5(
  src: Omit<BoneConstraint, 'id'> & { id?: string }
): BoneConstraint {
  if (src.id) return src as BoneConstraint
  return {
    ...src,
    id: v4(),
  }
}

export function migrateConstraint6(
  src: Omit<BoneConstraint, 'influence'>
): BoneConstraint {
  if (!isNaN(src.option.influence)) return src
  return {
    ...src,
    option: {
      ...src.option,
      influence: 1,
    },
  }
}
