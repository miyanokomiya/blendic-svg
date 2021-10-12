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
import Target from '/@/components/elements/BoneLayer.vue'
import { getBone } from '/@/models'

describe('src/components/elements/BoneLayer.vue', () => {
  describe('snapshot', () => {
    const getWrapper = () =>
      mount(Target, {
        props: {
          boneMap: { a: getBone({ id: 'a', tail: { x: 10, y: 10 } }) },
        },
      })
    it('defalut', () => {
      const wrapper = getWrapper()
      expect(wrapper.element).toMatchSnapshot()
    })
    it('selected', () => {
      const wrapper = getWrapper()
      wrapper.setProps({
        selectedBones: {
          a: { head: true },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('pose mode', () => {
      const wrapper = getWrapper()
      wrapper.setProps({
        canvasMode: 'pose',
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
