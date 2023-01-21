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

Copyright (C) 2023, Tomoya Komiyama.
*/

import {
  parsePathSegmentRaws,
  pathSegmentRawToString,
  reversePath,
} from 'okageo'
import { GraphNodeReversePath } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeReversePath> = {
  create(arg = {}) {
    return createBaseNode({
      inputs: {
        d: { value: [] },
      },
      ...arg,
      type: 'reverse_path',
    }) as GraphNodeReversePath
  },
  data: {},
  inputs: {
    d: { type: UNIT_VALUE_TYPES.D, default: [] },
  },
  outputs: { d: UNIT_VALUE_TYPES.D },
  computation(inputs): { d: string[] } {
    return {
      d: reversePath(parsePathSegmentRaws(inputs.d.join(' '))).map(
        pathSegmentRawToString
      ),
    }
  },
  width: 120,
  color: '#fff5ee',
  textColor: '#000',
  label: 'Reverse Path',
}
