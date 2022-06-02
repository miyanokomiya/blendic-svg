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

import { GraphNodeSetClipPath } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeSetClipPath> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        inputs: { object: { value: '' }, clip_path: { value: '' } },
        ...arg,
      }),
      type: 'set_clip_path',
    } as GraphNodeSetClipPath
  },
  data: {},
  inputs: {
    object: { type: UNIT_VALUE_TYPES.OBJECT, default: '' },
    clip_path: { type: UNIT_VALUE_TYPES.OBJECT, default: '' },
  },
  outputs: {
    object: UNIT_VALUE_TYPES.OBJECT,
  },
  computation(inputs, _self, context): { object: string } {
    context.setAttributes(inputs.object, {
      'clip-path': `url(#${inputs.clip_path})`,
    })
    context.setAttributes(inputs.clip_path, {
      id: inputs.clip_path,
    })
    return {
      object: inputs.object,
    }
  },
  width: 140,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Set Clip Path',
}
