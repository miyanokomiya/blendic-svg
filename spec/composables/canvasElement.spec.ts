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
import { useCanvasElement } from '/@/composables/canvasElement'

describe('src/composables/canvasElement.ts', () => {
  describe('useCanvasElement', () => {
    function getWrapper() {
      return shallowMount<any>({
        template: '<div ref="wrapper"><svg ref="svg"></svg></div>',
        setup() {
          const canvas = { setViewSize: jest.fn() } as any
          const { wrapper, svg, ...target } = useCanvasElement(() => canvas)

          return {
            wrapper,
            svg,
            target,
            canvas,
          }
        },
      })
    }

    it('should watch window resize and call adjustSvgSize', async () => {
      const wrapper = getWrapper()
      expect(wrapper.vm.canvas.setViewSize).toHaveBeenCalledWith({
        width: 0,
        height: 0,
      })
    })

    it('should return function to removeRootPosition', async () => {
      const wrapper = getWrapper()
      expect(wrapper.vm.target.removeRootPosition({ x: 1, y: 2 })).toEqual({
        x: 1,
        y: 2,
      })
    })

    it('should return function to addRootPosition', async () => {
      const wrapper = getWrapper()
      expect(wrapper.vm.target.addRootPosition({ x: 1, y: 2 })).toEqual({
        x: 1,
        y: 2,
      })
    })
  })
})
