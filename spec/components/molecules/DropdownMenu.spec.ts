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

import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Target from '/@/components/molecules/DropdownMenu.vue'

describe('src/components/molecules/DropdownMenu.vue', () => {
  describe('snapshot', () => {
    it('default', () => {
      const wrapper = mount(Target, {
        props: {
          label: 'menu1',
          items: [
            { label: 'item1', exec() {} },
            { label: 'item2', exec() {}, underline: true },
            { label: 'item3', exec() {} },
          ],
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('opened', async () => {
      const wrapper = mount(Target, {
        props: {
          label: 'menu1',
          items: [
            { label: 'item1', exec() {} },
            { label: 'item2', exec() {}, underline: true },
            { label: 'item3', exec() {} },
          ],
        },
      })
      wrapper.find('button').trigger('click')
      await nextTick()
      expect(wrapper.element).toMatchSnapshot()
    })
  })

  describe('click a item', () => {
    it('exec callback', async () => {
      const exec = jest.fn()
      const wrapper = mount(Target, {
        props: {
          label: 'menu1',
          items: [{ label: 'item', exec }],
        },
      })
      wrapper.find('button').trigger('click')
      await nextTick()
      wrapper.find('li > button').trigger('click')
      expect(exec).toHaveReturnedTimes(1)
    })
  })
})
