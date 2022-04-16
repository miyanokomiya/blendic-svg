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
import Target from '/@/components/atoms/FocusableBlock.vue'

describe('src/components/atoms/FocusableBlock.vue', () => {
  describe('snapshot', () => {
    it('defalut', () => {
      const wrapper = mount(Target, {
        slots: { defalut: 'slot content' },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })

  describe('copy & paste', () => {
    it('should capture copy events during focused', () => {
      const wrapper = mount(Target)
      document.dispatchEvent(new Event('copy', {}))
      expect(wrapper.emitted('copy')).toEqual(undefined)

      wrapper.find('div').trigger('focus')
      document.dispatchEvent(new Event('copy', {}))
      expect(wrapper.emitted('copy')).toHaveLength(1)

      wrapper.find('div').trigger('blur')
      document.dispatchEvent(new Event('copy', {}))
      expect(wrapper.emitted('copy')).toHaveLength(1)
    })
    it('should capture paste events during focused', () => {
      const wrapper = mount(Target)
      document.dispatchEvent(new Event('paste', {}))
      expect(wrapper.emitted('paste')).toEqual(undefined)

      wrapper.find('div').trigger('focus')
      document.dispatchEvent(new Event('paste', {}))
      expect(wrapper.emitted('paste')).toHaveLength(1)

      wrapper.find('div').trigger('blur')
      document.dispatchEvent(new Event('paste', {}))
      expect(wrapper.emitted('paste')).toHaveLength(1)
    })
  })
})
