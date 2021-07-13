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
import Target from '/@/components/atoms/GraphNodeDataField.vue'
import { getTransform } from '/@/models'
import { GRAPH_VALUE_STRUCT, GRAPH_VALUE_TYPE } from '/@/models/graphNode'

describe('src/components/atoms/GraphNodeDataField.vue', () => {
  describe('snapshot', () => {
    it('BOOLEAN', () => {
      const wrapper = mount(Target, {
        props: {
          modelValue: true,
          label: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.BOOLEAN,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('SCALER', () => {
      const wrapper = mount(Target, {
        props: {
          modelValue: 123,
          label: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.SCALER,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('OBJECT', () => {
      const wrapper = mount(Target, {
        props: {
          modelValue: 123,
          label: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.OBJECT,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('VECTOR2', () => {
      const wrapper = mount(Target, {
        props: {
          modelValue: { x: 1, y: 2 },
          label: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.VECTOR2,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('COLOR', () => {
      const wrapper = mount(Target, {
        props: {
          modelValue: getTransform({ rotate: 20 }),
          label: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.COLOR,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('TEXT', () => {
      const wrapper = mount(Target, {
        props: {
          modelValue: 'abc',
          label: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.TEXT,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('incompatible types', () => {
      const wrapper = mount(Target, {
        props: {
          modelValue: getTransform(),
          label: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.TRANSFORM,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('disabled', () => {
      const wrapper = mount(Target, {
        props: {
          modelValue: 'connected',
          label: 'value',
          type: {
            type: GRAPH_VALUE_TYPE.VECTOR2,
            struct: GRAPH_VALUE_STRUCT.UNIT,
          },
          disabled: true,
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
