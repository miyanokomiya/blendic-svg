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

import { PropType } from 'vue'
import { SpaceType } from '/@/models'
import type {
  KeyframeConstraintPropKey,
  KeyframePropsStatus,
} from '/@/models/keyframe'
import { BoneConstraintOption } from '/@/utils/constraints'

export function getProps<T extends BoneConstraintOption>() {
  return {
    modelValue: {
      type: Object as PropType<T>,
      required: true,
    },
    propsUpdatedStatus: {
      type: Object as PropType<
        Partial<{ [key in KeyframeConstraintPropKey]: boolean }>
      >,
      default: () => ({}),
    },
    boneOptions: {
      type: Array as PropType<{ value: string; label: string }[]>,
      default: () => [],
    },
    keyframeStatusMap: {
      type: Object as PropType<KeyframePropsStatus['props']>,
      default: () => ({}),
    },
    createKeyframe: {
      type: Function as PropType<(key: KeyframeConstraintPropKey) => void>,
      default: () => {},
    },
    deleteKeyframe: {
      type: Function as PropType<(key: KeyframeConstraintPropKey) => void>,
      default: () => {},
    },
  } as const
}

export const spaceTypeOptions: { value: SpaceType; label: string }[] = [
  { value: 'world', label: 'World' },
  { value: 'local', label: 'Local' },
]
