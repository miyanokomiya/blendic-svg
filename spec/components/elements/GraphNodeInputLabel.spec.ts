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
import Target from '/@/components/elements/GraphNodeInputLabel.vue'
import { getTransform } from '/@/models'
import { GRAPH_VALUE_STRUCT, GRAPH_VALUE_TYPE } from '/@/models/graphNode'

describe('src/components/elements/GraphNodeInputLabel.vue', () => {
  describe('snapshot', () => {
    it('connected', () => {
      const wrapper = mount(Target, {
        props: {
          input: { from: { id: 'a', key: 'b' } },
          inputKey: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.SCALER,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    describe('SCALER', () => {
      it('enum', () => {
        const wrapper = mount(Target, {
          props: {
            input: { value: 1 },
            inputKey: 'value',
            type: {
              type: GRAPH_VALUE_TYPE.SCALER,
              struct: GRAPH_VALUE_STRUCT.UNIT,
              enumKey: 'SPREAD_METHOD',
            },
          },
        })
        expect(wrapper.element).toMatchSnapshot()
      })
      it('number', () => {
        const wrapper = mount(Target, {
          props: {
            input: { value: 1234567 },
            inputKey: 'value',
            type: {
              type: GRAPH_VALUE_TYPE.SCALER,
              struct: GRAPH_VALUE_STRUCT.UNIT,
            },
          },
        })
        expect(wrapper.element).toMatchSnapshot()
      })
    })
    it('VECTOR2', () => {
      const wrapper = mount(Target, {
        props: {
          input: { value: { x: 555555, y: 888888 } },
          inputKey: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.VECTOR2,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('BOOLEAN', () => {
      const wrapper = mount(Target, {
        props: {
          input: { value: true },
          inputKey: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.BOOLEAN,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('D', () => {
      const wrapper = mount(Target, {
        props: {
          input: { value: ['M1,2 L3,4'] },
          inputKey: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.D,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('COLOR', () => {
      const wrapper = mount(Target, {
        props: {
          input: { value: getTransform({ rotate: 20 }) },
          inputKey: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.COLOR,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
