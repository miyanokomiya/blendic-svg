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

import { shallowMount } from '@vue/test-utils'
import Target from '/@/components/elements/GraphKeyframes.vue'
import { getCurve, getKeyframeBone, getKeyframePoint } from '/@/models/keyframe'

const keyframeMapByFrame = {
  1: getKeyframeBone({
    id: 'a',
    points: {
      translateX: getKeyframePoint({
        value: 1,
        curve: getCurve('linear'),
      }),
    },
  }),
  2: getKeyframeBone({
    id: 'b',
    points: {
      translateX: getKeyframePoint({
        value: 10,
        curve: getCurve('bezier3'),
      }),
    },
  }),
}

describe('src/components/elements/GraphKeyframes.vue', () => {
  describe('snapshot', () => {
    it('default', () => {
      const wrapper = shallowMount(Target, {
        props: {
          keyframeMapByFrame,
          colorMap: { translateX: 'green' },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
