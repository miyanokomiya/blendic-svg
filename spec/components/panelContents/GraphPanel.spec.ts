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
import Target from '/@/components/panelContents/GraphPanel.vue'
import {
  getCurve,
  getKeyframeBone,
  getKeyframePoint,
  KeyframeSelectedState,
} from '/@/models/keyframe'

describe('src/components/panelContents/GraphPanel.vue', () => {
  describe('snapshot', () => {
    it('no keyframe', () => {
      const wrapper = mount(Target)
      expect(wrapper.element).toMatchSnapshot()
    })
    it('with selected keyframe', () => {
      const wrapper = mount(Target, {
        props: {
          keyframe: getKeyframeBone({
            points: {
              translateX: getKeyframePoint({
                curve: getCurve('bezier3'),
              }),
            },
          }),
          selectedState: {
            name: 'bone',
            props: { translateX: true },
          } as KeyframeSelectedState,
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
