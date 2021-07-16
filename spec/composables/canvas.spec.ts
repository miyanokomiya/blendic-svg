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
import { useGetBBox } from '/@/composables/canvas'

describe('src/composables/canvas.ts', () => {
  describe('useGetBBox', () => {
    it('should use getBBox if the method is found', () => {
      const wrapper = shallowMount(
        {
          template: '<div />',
          setup() {
            const fn = useGetBBox()
            return { fn }
          },
        },
        {
          global: { provide: { getScale: () => 2 } },
        }
      )
      expect(
        wrapper.vm.fn({
          getBBox: () => ({ width: 10, height: 20 }),
        } as any)
      ).toEqual({ width: 10, height: 20 })
    })
    it('should fallback getBBox if the method is not found', () => {
      const wrapper = shallowMount(
        {
          template: '<div />',
          setup() {
            const fn = useGetBBox()
            return { fn }
          },
        },
        {
          global: { provide: { getScale: () => 2 } },
        }
      )
      expect(
        wrapper.vm.fn({
          getBoundingClientRect: () => ({ width: 10, height: 20 }),
        } as any)
      ).toEqual({ width: 20, height: 40 })
    })
  })
})
