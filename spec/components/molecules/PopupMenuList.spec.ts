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
import Target from '/@/components/molecules/PopupMenuList.vue'

describe('src/components/molecules/PopupMenuList.vue', () => {
  describe('snapshot', () => {
    it('default', () => {
      const wrapper = mount(Target, {
        props: {
          popupMenuList: [
            { label: 'item1', exec() {} },
            { label: 'item2', exec() {} },
            { label: 'item3', exec() {} },
          ],
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('focused item', () => {
      const wrapper = mount(Target, {
        props: {
          popupMenuList: [
            { label: 'item1', exec() {} },
            { label: 'item2', exec() {}, focus: true },
            { label: 'item3', exec() {} },
          ],
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('with children', () => {
      const wrapper = mount(Target, {
        props: {
          popupMenuList: [
            { label: 'item1', exec() {} },
            { label: 'item2', exec() {} },
            {
              label: 'item3',
              opened: true,
              children: [
                { label: 'child1', exec() {} },
                { label: 'child2', exec() {} },
              ],
            },
          ],
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    describe('with search field', () => {
      const props = {
        popupMenuList: [
          { label: 'item1', exec() {} },
          { label: 'item2', exec() {} },
          { label: 'item3', exec() {} },
        ],
        enabledSearch: true,
      }

      it('keyword is empty', () => {
        const wrapper = mount(Target, { props })
        expect(wrapper.element).toMatchSnapshot()
      })
      it('keyword hits something', async () => {
        const wrapper = mount(Target, { props })
        await wrapper.find('input').setValue('m2')
        expect(wrapper.element).toMatchSnapshot()
      })
      it('keyword hits nothing', async () => {
        const wrapper = mount(Target, { props })
        await wrapper.find('input').setValue('mmm')
        expect(wrapper.element).toMatchSnapshot()
      })
    })
  })

  describe('click a item', () => {
    it('exec callback', () => {
      const exec = jest.fn()
      const wrapper = mount(Target, {
        props: { popupMenuList: [{ label: 'item', exec }] },
      })
      wrapper.find('button').trigger('click')
      expect(exec).toHaveReturnedTimes(1)
    })
  })
})
