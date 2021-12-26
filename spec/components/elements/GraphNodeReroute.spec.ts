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
import Target from '/@/components/elements/GraphNodeReroute.vue'
import { GRAPH_VALUE_STRUCT, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { createGraphNode } from '/@/utils/graphNodes'

describe('src/components/elements/GraphNodeReroute.vue', () => {
  describe('snapshot', () => {
    const node = createGraphNode('reroute')
    const edgePositions = {
      inputs: {
        value: {
          p: { x: 1, y: 2 },
          type: {
            type: GRAPH_VALUE_TYPE.VECTOR2,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      },
      outputs: {
        value: {
          p: { x: 10, y: 2 },
          type: {
            type: GRAPH_VALUE_TYPE.VECTOR2,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      },
    }

    it('initial', () => {
      const wrapper = mount(Target, {
        props: { node, edgePositions },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('selected', () => {
      const wrapper = mount(Target, {
        props: {
          node,
          edgePositions,
          selected: true,
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
