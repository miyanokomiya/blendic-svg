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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { getTransform, Transform } from '/@/models'
import { GraphNodeGetBone } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeGetBone> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: { bone: '' },
        inputs: {},
        ...arg,
      }),
      type: 'get_bone',
    } as GraphNodeGetBone
  },
  data: {
    bone: {
      type: UNIT_VALUE_TYPES.BONE,
      default: '',
    },
  },
  inputs: {},
  outputs: {
    transform: UNIT_VALUE_TYPES.TRANSFORM,
  },
  computation(_inputs, self, context): { transform: Transform } {
    return {
      transform:
        context.getBoneSummary(self.data.bone)?.transform ?? getTransform(),
    }
  },
  width: 120,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Get Bone',
}
