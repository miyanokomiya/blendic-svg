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
import Target from '/@/components/elements/molecules/KeyPointGroup.vue'
import { getKeyframeBone, getKeyframePoint } from '/@/models/keyframe'
import { getKeyframeDefaultPropsMap } from '/@/utils/keyframes'

const childMap = {
  translateX: 0,
  translateY: 1,
  rotate: 2,
  scaleX: 3,
  scaleY: 4,
}

describe('src/components/elements/molecules/KeyPointGroup.vue', () => {
  describe('snapshot', () => {
    it('default', () => {
      const wrapper = mount(Target, {
        props: {
          keyFrame: getKeyframeBone({
            points: {
              translateX: getKeyframePoint(),
              scaleX: getKeyframePoint(),
            },
          }),
          childMap,
          top: 10,
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('selected', () => {
      const wrapper = mount(Target, {
        props: {
          keyFrame: getKeyframeBone(),
          childMap,
          selected: true,
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('expanded', () => {
      const wrapper = mount(Target, {
        props: {
          keyFrame: getKeyframeBone({
            points: {
              translateX: getKeyframePoint(),
              scaleX: getKeyframePoint(),
            },
          }),
          childMap,
          expanded: true,
          sameRangeWidth: getKeyframeDefaultPropsMap(() => 1),
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
