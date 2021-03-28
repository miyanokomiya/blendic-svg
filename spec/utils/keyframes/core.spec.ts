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

import {
  CurveBezier3,
  getKeyframeBone,
  getKeyframePoint,
} from '/@/models/keyframe'
import * as target from '/@/utils/keyframes/core'

describe('utils/keyframes.ts', () => {
  describe('getNeighborKeyframes', () => {
    it('get empty if no neighbors exists', () => {
      const ret = target.getNeighborKeyframes([], 1)
      expect(ret).toEqual([])
    })
    it('get myself if a keyframe with the frame exists', () => {
      const ret = target.getNeighborKeyframes(
        [getKeyframeBone({ frame: 1 })],
        1
      )
      expect(ret).toEqual([getKeyframeBone({ frame: 1 })])
    })
    it('get last if all keyframes are smaller than the frame', () => {
      const ret = target.getNeighborKeyframes(
        [getKeyframeBone({ frame: 1 })],
        2
      )
      expect(ret).toEqual([getKeyframeBone({ frame: 1 })])
    })
    it('get first if all keyframes are bigger than the frame', () => {
      const ret = target.getNeighborKeyframes(
        [getKeyframeBone({ frame: 1 })],
        0
      )
      expect(ret).toEqual([getKeyframeBone({ frame: 1 })])
    })
    it('get neighbor keyframes', () => {
      const ret = target.getNeighborKeyframes(
        [
          getKeyframeBone({ frame: 0 }),
          getKeyframeBone({ frame: 1 }),
          getKeyframeBone({ frame: 4 }),
          getKeyframeBone({ frame: 5 }),
        ],
        2
      )
      expect(ret).toEqual([
        getKeyframeBone({ frame: 1 }),
        getKeyframeBone({ frame: 4 }),
      ])
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

    it('constant', () => {
      const fn = target.getCurveFn(start, end, { name: 'constant' })
      expect(fn(10)).toBeCloseTo(20)
      expect(fn(15)).toBeCloseTo(20)
      expect(fn(20)).toBeCloseTo(20)
    })

    it('linear', () => {
      const fn = target.getCurveFn(start, end, { name: 'linear' })
      expect(fn(10)).toBeCloseTo(20)
      expect(fn(15)).toBeCloseTo(30)
      expect(fn(20)).toBeCloseTo(40)
    })

    it('bezier3', () => {
      const fn = target.getCurveFn(start, end, {
        name: 'bezier3',
        c1: { x: 0.5, y: 0 },
        c2: { x: 0.5, y: 1 },
      } as CurveBezier3)
      expect(fn(10)).toBeCloseTo(20)
      expect(fn(12.5)).toBeLessThan(25)
      expect(fn(15)).toBeCloseTo(30)
      expect(fn(17.5)).toBeGreaterThan(35)
      expect(fn(20)).toBeCloseTo(40)
    })
  })

  describe('getNormalizedBezier3Points', () => {
    it('convert relative controller points to absolute ones', () => {
      const start = { x: 10, y: 20 }
      const end = { x: 20, y: 40 }
      const ret = target.getNormalizedBezier3Points(
        start,
        { x: 0.5, y: -0.2 },
        { x: 0.6, y: 1.2 },
        end
      )
      expect(ret).toEqual([start, { x: 15, y: 16 }, { x: 16, y: 44 }, end])
    })
  })

  describe('isSameKeyframePoint', () => {
    it('return true if two args have same value', () => {
      expect(
        target.isSameKeyframePoint(
          getKeyframePoint({ value: 1 }),
          getKeyframePoint({ value: 1 })
        )
      ).toBe(true)
    })
    it('return false if two args have different value', () => {
      expect(
        target.isSameKeyframePoint(
          getKeyframePoint({ value: 1 }),
          getKeyframePoint({ value: 2 })
        )
      ).toBe(false)
    })
  })
})
