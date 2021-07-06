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
import Target from '/@/components/elements/atoms/NativeElement.vue'
import { getElementNode } from '/@/models'

describe('src/components/elements/atoms/NativeElement.vue', () => {
  describe('snapshot', () => {
    it('nested svg tree', () => {
      const wrapper = mount(Target, {
        props: {
          element: getElementNode({
            tag: 'g',
            attributes: { fill: 'red' },
            children: [
              getElementNode({
                id: 'text_1',
                tag: 'text',
                children: ['text1'],
              }),
              getElementNode({
                id: 'text_2',
                tag: 'text',
                children: ['text1', 'text2'],
              }),
            ],
          }),
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('selected', () => {
      const wrapper = mount(Target, {
        props: {
          element: getElementNode({
            tag: 'g',
            attributes: { fill: 'red' },
            children: [
              getElementNode({
                id: 'text_1',
                tag: 'text',
                children: ['text1'],
              }),
              getElementNode({
                id: 'text_2',
                tag: 'text',
                children: ['text1', 'text2'],
              }),
            ],
          }),
          groupSelected: true,
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
