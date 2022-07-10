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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { mount } from '@vue/test-utils'
import Target from '/@/components/atoms/ToggleRadioButtons.vue'

describe('src/components/atoms/ToggleRadioButtons.vue', () => {
  const options = [
    { value: 0, label: 'a' },
    { value: 1, label: 'b' },
    { value: 2, label: 'c' },
  ]
  describe('snapshot', () => {
    it('default', () => {
      const wrapper = mount(Target, {
        props: { modelValue: 1, options },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('disabled', () => {
      const wrapper = mount(Target, {
        props: { modelValue: 1, options, disabled: true },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })

  describe('modelValue', () => {
    it('should treat as singular value', () => {
      const wrapper = mount(Target, {
        props: { modelValue: 1, options },
      })
      wrapper.find('button:nth-child(3)').trigger('click')
      // Avoid clearing every value
      wrapper.find('button:nth-child(3)').trigger('click')
      wrapper.find('button:nth-child(2)').trigger('click')
      expect(wrapper.emitted('update:model-value')).toEqual([[2], [2], [1]])
    })
  })
})
