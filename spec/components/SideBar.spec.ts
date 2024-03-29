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
import Target from '/@/components/SideBar.vue'

describe('src/components/SideBar.vue', () => {
  describe('snapshot', () => {
    it('defalut', () => {
      const wrapper = mount(Target, {
        props: {
          tabs: [
            { key: 'a', label: 'aa' },
            { key: 'b', label: 'bb' },
            { key: 'c', label: 'cc' },
          ],
          defaultTab: 'b',
        },
        slots: {
          a: '<div>aaa</div>',
          b: '<div>bbb</div>',
          c: '<div>ccc</div>',
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('delighlight', () => {
      const wrapper = mount(Target, {
        props: {
          tabs: [{ key: 'a', label: 'aa' }],
          defaultTab: 'a',
          delighlight: true,
        },
        slots: { a: '<div>aaa</div>' },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
