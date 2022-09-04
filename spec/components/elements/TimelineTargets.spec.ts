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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { mount } from '@vue/test-utils'
import Target from '/@/components/elements/TimelineTargets.vue'
import { TargetPropsState } from '/@/composables/stores/targetProps'
import { IdMap } from '/@/models'
import { KeyframeTargetSummary } from '/@/utils/helpers'

describe('src/components/elements/TimelineTargets.vue', () => {
  describe('snapshot', () => {
    const targetList: KeyframeTargetSummary[] = [
      {
        id: 'a',
        name: 'name_a',
        children: { rotate: 2 },
      },
      {
        id: 'b',
        name: 'name_b',
        children: {
          translateX: 0,
          rotate: 2,
          scaleX: 3,
        },
      },
    ]
    const targetTopMap: IdMap<number> = { a: 0, b: 100 }
    const propsStateMap: IdMap<TargetPropsState> = {
      a: { props: { rotate: 'selected' } },
      b: {
        props: {
          translateX: 'selected',
          rotate: 'selected',
          scaleX: 'hidden',
        },
      },
    }

    it('status: expanded', () => {
      const wrapper = mount(Target, {
        props: {
          targetList,
          targetTopMap,
          propsStateMap,
          targetExpandedMap: { a: true, b: true },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('status: folded', () => {
      const wrapper = mount(Target, {
        props: {
          targetList,
          targetTopMap,
          propsStateMap,
          targetExpandedMap: { a: false, b: false },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
