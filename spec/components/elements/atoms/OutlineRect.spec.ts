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
import Target from '/@/components/elements/atoms/OutlineRect.vue'

describe('src/components/elements/atoms/OutlineRect.vue', () => {
  describe('snapshot', () => {
    it('default', () => {
      const wrapper = mount(Target, {
        props: {
          dep: 0,
          marginSize: { width: 1, height: 20 },
        },
        slots: {
          default: '<text>abc</text>',
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })

  describe('should calc inner size', () => {
    it('if dep is updated', async () => {
      const wrapper = mount(Target, {
        props: {
          dep: 0,
          marginSize: { width: 1, height: 20 },
        },
        slots: {
          default: '<text>abc</text>',
        },
      })
      wrapper.vm.size = { width: 10, height: 100 }
      await wrapper.setProps({ dep: 1 })
      expect(wrapper.vm.size).toEqual({ width: 2, height: 40 })
    })
    it('if marginSize is updated', async () => {
      const wrapper = mount(Target, {
        props: {
          dep: 0,
          marginSize: { width: 1, height: 20 },
        },
        slots: {
          default: '<text>abc</text>',
        },
      })
      await wrapper.setProps({
        marginSize: { width: 100, height: 200 },
      })
      expect(wrapper.vm.size).toEqual({ width: 200, height: 400 })
    })
  })
})
