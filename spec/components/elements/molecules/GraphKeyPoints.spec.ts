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
import Target from '/@/components/elements/molecules/GraphKeyPoints.vue'
import { getCurve, getKeyframeBone, getKeyframePoint } from '/@/models/keyframe'
import { getKeyframeDefaultPropsMap } from '/@/utils/keyframes'

const keyframes = [
  getKeyframeBone({
    id: 'a',
    points: {
      translateX: getKeyframePoint({
        value: 1,
        curve: getCurve('linear'),
      }),
    },
  }),
  getKeyframeBone({
    id: 'b',
    points: {
      translateX: getKeyframePoint({
        value: 10,
        curve: getCurve('bezier3'),
      }),
    },
  }),
]

describe('src/components/elements/molecules/GraphKeyPoints.vue', () => {
  describe('snapshot', () => {
    it('default', () => {
      const wrapper = mount(Target, {
        props: {
          pointKey: 'translateX',
          keyframes,
          color: 'green',
        },
        global: {
          provide: {
            scale: 2.2,
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('selected', () => {
      const wrapper = mount(Target, {
        props: {
          pointKey: 'translateX',
          keyframes,
          selectedStateMap: { a: getKeyframeDefaultPropsMap(() => true) },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
