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

import { GraphNodeCreateObjectClipPath } from '/@/models/graphNode'
import { getGraphValueEnumKey } from '/@/models/graphNodeEnums'
import {
  createBaseNode,
  NodeStruct,
  nodeToCreateObjectProps,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCreateObjectClipPath> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {},
        inputs: {
          disabled: { value: false },
          parent: { value: '' },
          relative: { value: false },
        },
        ...arg,
      }),
      type: 'create_object_clip_path',
    } as GraphNodeCreateObjectClipPath
  },
  data: {},
  inputs: {
    disabled: {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: false,
    },
    parent: {
      type: UNIT_VALUE_TYPES.OBJECT,
      default: '',
    },
    relative: {
      type: UNIT_VALUE_TYPES.BOOLEAN,
      default: false,
    },
  },
  outputs: nodeToCreateObjectProps.outputs,
  computation(inputs, self, context): { object: string; parent: string } {
    if (inputs.disabled) return { object: '', parent: inputs.parent }

    return {
      object: context.createObject('clipPath', {
        id: self.id,
        parent: inputs.parent,
        attributes: {
          clipPathUnits: getGraphValueEnumKey(
            'SPACE_UNITS',
            inputs.relative ? 1 : 0
          ),
        },
      }),
      parent: inputs.parent,
    }
  },
  width: 160,
  color: '#dc143c',
  textColor: '#fff',
  label: 'Create Clip Path',
}
