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

import { getMockPoseCtx } from 'spec/composables/modeStates/appCanvas/mocks'
import {
  getLastSelectedBoneSpace,
  handleToggleAxisGrid,
} from '/@/composables/modeStates/appCanvas/poseMode/utils'
import { getBone, getTransform } from '/@/models'

describe('src/composables/modeStates/appCanvas/poseMode/utils.ts', () => {
  describe('getLastSelectedBoneSpace', () => {
    it('should return the bone space information', () => {
      const result = getLastSelectedBoneSpace({
        getLastSelectedBoneId: () => 'a',
        getBones: () => ({
          a: getBone({
            head: { x: 10, y: 0 },
            transform: getTransform({ translate: { x: 5, y: 0 } }),
          }),
        }),
      })
      expect(result.origin).toEqual({ x: 10, y: 5 })
      expect(result.radian).toBeCloseTo(Math.PI / 2, 0.0001)
    })

    it('having a parent: should return the bone space information', () => {
      const result = getLastSelectedBoneSpace({
        getLastSelectedBoneId: () => 'a',
        getBones: () => ({
          a: getBone({
            head: { x: 10, y: 0 },
            transform: getTransform({ translate: { x: 5, y: 0 } }),
            parentId: 'p',
          }),
          p: getBone({ transform: getTransform({ rotate: 90 }) }),
        }),
      })
      expect(result.origin).toEqual({ x: 10, y: 5 })
      expect(result.radian).toBeCloseTo(Math.PI, 0.0001)
    })
  })

  describe('handleToggleAxisGrid', () => {
    it('x: should execute "setAxisGridInfo" to toggle axis "x"', () => {
      const ctx = getMockPoseCtx()
      const val = {
        axis: 'x',
        local: false,
        vec: { x: 1, y: 0 },
        origin: expect.anything(),
      }

      ctx.getAxisGridInfo.mockReturnValue(undefined)
      handleToggleAxisGrid(ctx, 'x')
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(1, val)

      ctx.getAxisGridInfo.mockReturnValue(val)
      handleToggleAxisGrid(ctx, 'x')
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(2, {
        ...val,
        local: true,
      })

      ctx.getAxisGridInfo.mockReturnValue({ ...val, local: true })
      handleToggleAxisGrid(ctx, 'x')
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(3)
    })

    it('y: should execute "setAxisGridInfo" to toggle axis "y"', () => {
      const ctx = getMockPoseCtx()
      const val = {
        axis: 'y',
        local: false,
        vec: { x: 0, y: 1 },
        origin: expect.anything(),
      }

      ctx.getAxisGridInfo.mockReturnValue(undefined)
      handleToggleAxisGrid(ctx, 'y')
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(1, val)

      ctx.getAxisGridInfo.mockReturnValue(val)
      handleToggleAxisGrid(ctx, 'y')
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(2, {
        ...val,
        local: true,
      })

      ctx.getAxisGridInfo.mockReturnValue({ ...val, local: true })
      handleToggleAxisGrid(ctx, 'y')
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(3)
    })
  })
})
