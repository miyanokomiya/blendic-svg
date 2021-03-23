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

import { getTransform } from '/@/models'
import { getKeyframeBone } from '/@/models/keyframe'
import * as target from '/@/utils/keyframes'

describe('utils/keyframes.ts', () => {
  describe('interpolateKeyframeBone', () => {
    it('translate', () => {
      expect(
        target.interpolateKeyframeBone(
          [
            getKeyframeBone({
              frame: 0,
              translateX: { value: 10, curve: { name: 'linear' } },
              translateY: { value: 20, curve: { name: 'linear' } },
            }),
            getKeyframeBone({
              frame: 1,
              translateX: { value: 100, curve: { name: 'linear' } },
              translateY: { value: 200, curve: { name: 'linear' } },
            }),
            getKeyframeBone({
              frame: 2,
            }),
            getKeyframeBone({
              frame: 4,
            }),
            getKeyframeBone({
              frame: 5,
              translateX: { value: 1000, curve: { name: 'linear' } },
              translateY: { value: 2000, curve: { name: 'linear' } },
            }),
          ],
          3
        )
      ).toEqual(getTransform({ translate: { x: 550, y: 1100 } }))
    })
    it('rotate', () => {
      expect(
        target.interpolateKeyframeBone(
          [
            getKeyframeBone({
              frame: 0,
              rotate: { value: 10, curve: { name: 'linear' } },
            }),
            getKeyframeBone({
              frame: 1,
              rotate: { value: 100, curve: { name: 'linear' } },
            }),
            getKeyframeBone({
              frame: 2,
            }),
            getKeyframeBone({
              frame: 4,
            }),
            getKeyframeBone({
              frame: 5,
              rotate: { value: 1000, curve: { name: 'linear' } },
            }),
          ],
          3
        )
      ).toEqual(getTransform({ rotate: 550 }))
    })
    it('scale', () => {
      expect(
        target.interpolateKeyframeBone(
          [
            getKeyframeBone({
              frame: 0,
              scaleX: { value: 10, curve: { name: 'linear' } },
              scaleY: { value: 20, curve: { name: 'linear' } },
            }),
            getKeyframeBone({
              frame: 1,
              scaleX: { value: 100, curve: { name: 'linear' } },
              scaleY: { value: 200, curve: { name: 'linear' } },
            }),
            getKeyframeBone({
              frame: 2,
            }),
            getKeyframeBone({
              frame: 4,
            }),
            getKeyframeBone({
              frame: 5,
              scaleX: { value: 1000, curve: { name: 'linear' } },
              scaleY: { value: 2000, curve: { name: 'linear' } },
            }),
          ],
          3
        )
      ).toEqual(getTransform({ scale: { x: 550, y: 1100 } }))
    })
  })

  describe('interpolateKeyframePoint', () => {
    it('interpolate', () => {
      const start = {
        frame: 10,
        keyframePoint: {
          value: 20,
          curve: { name: 'linear' },
        },
      } as const
      const end = {
        frame: 20,
        keyframePoint: {
          value: 40,
          curve: { name: 'linear' },
        },
      } as const
      expect(target.interpolateKeyframePoint(start, end, 15)).toBeCloseTo(30)
    })
  })

  describe('getCurveFn', () => {
    const start = { x: 10, y: 20 }
    const end = { x: 20, y: 40 }

    it('linear', () => {
      const fn = target.getCurveFn(start, end, { name: 'linear' })
      expect(fn(10)).toBeCloseTo(20)
      expect(fn(15)).toBeCloseTo(30)
      expect(fn(20)).toBeCloseTo(40)
    })

    xit('TODO bezier3', () => {
      const fn = target.getCurveFn(start, end, { name: 'bezier3' })
      expect(fn(10)).toBeCloseTo(20)
      expect(fn(20)).toBeCloseTo(40)
    })
  })

  describe('inversedSelectedState', () => {
    it('inverse selected state', () => {
      expect(
        target.inversedSelectedState(
          { translateX: true, scaleX: true },
          { translateX: true, rotate: true }
        )
      ).toEqual({
        rotate: true,
        scaleX: true,
      })
    })
    it('do nothing if target is empty', () => {
      expect(
        target.inversedSelectedState(target.getAllSelectedState(), {})
      ).toEqual(target.getAllSelectedState())
    })
  })
})
