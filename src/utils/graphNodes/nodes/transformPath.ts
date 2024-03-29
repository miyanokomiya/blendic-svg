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
  add,
  multi,
  pathSegmentRawToString,
  parsePathSegmentRaws,
  slidePath,
  rotatePath,
  scalePath,
} from 'okageo'
import { getTransform } from '/@/models'
import { GraphNodeTransformPath } from '/@/models/graphNode'
import {
  createBaseNode,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export const struct: NodeStruct<GraphNodeTransformPath> = {
  create(arg = {}) {
    return {
      ...createBaseNode({
        data: {},
        inputs: {
          d: { value: [] },
          transform: { value: getTransform() },
        },
        ...arg,
      }),
      type: 'transform_path',
    } as GraphNodeTransformPath
  },
  data: {},
  inputs: {
    d: { type: UNIT_VALUE_TYPES.D, default: [] },
    transform: { type: UNIT_VALUE_TYPES.TRANSFORM, default: getTransform() },
  },
  outputs: { d: UNIT_VALUE_TYPES.D },
  computation(inputs): { d: string[] } {
    return {
      d: slidePath(
        rotatePath(
          scalePath(
            slidePath(
              parsePathSegmentRaws(inputs.d.join(' ')),
              multi(inputs.transform.origin, -1)
            ),
            inputs.transform.scale
          ),
          (inputs.transform.rotate * Math.PI) / 180
        ),
        add(inputs.transform.origin, inputs.transform.translate)
      ).map(pathSegmentRawToString),
    }
  },
  width: 140,
  color: '#fff5ee',
  textColor: '#000',
  label: 'Transform Path',
}
