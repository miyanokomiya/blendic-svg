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
import Target from '/@/components/atoms/ColorRect.vue'
import { hsvaToRgba, hsvaToTransform, rednerRGBA } from '/@/utils/color'

const hsva = { h: 100, s: 0.2, v: 0.4, a: 0.3 }
const transform = hsvaToTransform(hsva)

describe('src/components/atoms/ColorRect.vue', () => {
  describe('snapshot', () => {
    it('props: hsva', () => {
      const wrapper = mount(Target, {
        props: { hsva },
      })
      expect(wrapper.vm.color).toBe(rednerRGBA(hsvaToRgba(hsva)))
      expect(wrapper.element).toMatchSnapshot()
    })
    it('props: transform', () => {
      const wrapper = mount(Target, {
        props: { transform },
      })
      expect(wrapper.vm.color).toBe(rednerRGBA(hsvaToRgba(hsva)))
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
