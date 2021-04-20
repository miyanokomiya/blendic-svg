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
import Target from '/@/components/atoms/SliderInput.vue'

describe('src/components/atoms/SliderInput.vue', () => {
  describe('snapshot', () => {
    it('default', () => {
      const wrapper = mount(Target, {
        props: { modelValue: 12 },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('disabled', () => {
      const wrapper = mount(Target, {
        props: { modelValue: 12, disabled: true },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })

  describe('scaleX', () => {
    it('should be clamped between 0 to 1', () => {
      expect(
        mount(Target, {
          props: { modelValue: -2, min: 0, max: 10 },
        }).vm.scaleX
      ).toBe(0)
      expect(
        mount(Target, {
          props: { modelValue: 12, min: 0, max: 10 },
        }).vm.scaleX
      ).toBe(1)
    })
  })
})
