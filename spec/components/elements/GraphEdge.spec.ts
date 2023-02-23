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
import Target from '/@/components/elements/GraphEdge.vue'
import { UNIT_VALUE_TYPES } from '/@/utils/graphNodes/core'

describe('src/components/elements/GraphEdge.vue', () => {
  describe('snapshot', () => {
    it('initial', () => {
      const wrapper = mount(Target, {
        props: { from: { x: 1, y: 2 }, to: { x: 10, y: 20 } },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('connecting', () => {
      const wrapper = mount(Target, {
        props: {
          from: { x: 1, y: 2 },
          to: { x: 10, y: 20 },
          status: 'connecting',
          type: UNIT_VALUE_TYPES.SCALER,
          inputMarker: true,
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('connected', () => {
      const wrapper = mount(Target, {
        props: {
          from: { x: 1, y: 2 },
          to: { x: 10, y: 20 },
          status: 'connected',
          type: UNIT_VALUE_TYPES.SCALER,
          outputMarker: true,
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
