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
import Target from '/@/components/elements/molecules/BezierControls.vue'

describe('src/components/elements/molecules/BezierControls.vue', () => {
  describe('snapshot', () => {
    it('default', () => {
      const wrapper = mount(Target, {
        props: {
          pointId: 'a',
          pointKey: 'p',
          c0: { x: 1, y: 2 },
          controlIn: { x: 3, y: 4 },
          controlOut: { x: 5, y: 6 },
          color: 'red',
          scale: 1.2,
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
