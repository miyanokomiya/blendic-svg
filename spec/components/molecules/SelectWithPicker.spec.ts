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
import Target from '/@/components/molecules/SelectWithPicker.vue'

describe('src/components/molecules/SelectWithPicker.vue', () => {
  describe('snapshot', () => {
    it('default', () => {
      const wrapper = mount(Target, {
        props: {
          modelValue: '',
          name: 'name_1',
          options: [
            { label: 'item1', value: 'a' },
            { label: 'item2', value: 'b' },
            { label: 'item3', value: 'c' },
          ],
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})