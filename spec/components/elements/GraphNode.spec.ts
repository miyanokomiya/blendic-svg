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

import { mount } from '@vue/test-utils'
import Target from '/@/components/elements/GraphNode.vue'
import { GRAPH_VALUE_STRUCT, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createGraphNode } from '/@/utils/graphNodes'

describe('src/components/elements/GraphNode.vue', () => {
  describe('snapshot', () => {
    it('initial', () => {
      const wrapper = mount(Target, {
        props: {
          node: createGraphNode('make_vector2'),
          edgePositions: {
            inputs: {
              x: {
                p: { x: 1, y: 2 },
                type: {
                  type: GRAPH_VALUE_TYPE.VECTOR2,
                  struct: GRAPH_VALUE_STRUCT.UNIT,
                },
              },
            },
            outputs: {
              value: {
                p: { x: 1, y: 2 },
                type: {
                  type: GRAPH_VALUE_TYPE.VECTOR2,
                  struct: GRAPH_VALUE_STRUCT.UNIT,
                },
              },
            },
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('selected', () => {
      const wrapper = mount(Target, {
        props: {
          node: createGraphNode('make_vector2'),
          selected: true,
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('with data fields', () => {
      const wrapper = mount(Target, {
        props: {
          node: createGraphNode('scaler'),
          selected: true,
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
