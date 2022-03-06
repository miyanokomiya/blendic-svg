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

import { GraphNodeCustomBeginInput } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeCustomBeginInput> = {
  create(arg = {}) {
    return {
      ...createBaseNode(arg),
      type: 'custom_begin_input',
    } as GraphNodeCustomBeginInput
  },
  data: {},
  inputs: {},
  outputs: {
    input: UNIT_VALUE_TYPES.INPUT,
  },
  computation(_, self) {
    return { input: self.id }
  },
  width: 130,
  color: '#ff7f50',
  textColor: '#fff',
  label: 'Begin Input',
}
