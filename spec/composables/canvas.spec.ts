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
import { centerizeView, useGetBBox } from '/@/composables/canvas'

describe('src/composables/canvas.ts', () => {
  describe('centerizeView', () => {
    it('should return view parameters to centerize the rectangle', () => {
      const viewRect = { width: 100, height: 100 } as const
      expect(
        centerizeView({ x: 50, y: 50, width: 40, height: 20 }, viewRect)
      ).toEqual({
        viewOrigin: { x: 50, y: 40 },
        scale: 0.4,
      })
      expect(
        centerizeView({ x: 50, y: 50, width: 20, height: 40 }, viewRect)
      ).toEqual({
        viewOrigin: { x: 40, y: 50 },
        scale: 0.4,
      })
      expect(
        centerizeView({ x: 50, y: 50, width: 200, height: 120 }, viewRect)
      ).toEqual({
        viewOrigin: { x: 50, y: 10 },
        scale: 2,
      })
      expect(
        centerizeView({ x: 50, y: 50, width: 120, height: 200 }, viewRect)
      ).toEqual({
        viewOrigin: { x: 10, y: 50 },
        scale: 2,
      })
    })
    it('should apply scale reducer if it is supplied', () => {
      const viewRect = { width: 100, height: 100 } as const
      expect(
        centerizeView(
          { x: 0, y: 0, width: 100, height: 100 },
          viewRect,
          () => 2
        )
      ).toEqual({
        viewOrigin: { x: -50, y: -50 },
        scale: 2,
      })
    })
  })

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
