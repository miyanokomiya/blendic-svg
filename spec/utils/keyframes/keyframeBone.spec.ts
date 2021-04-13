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
import { getCurve, getKeyframeBone, getKeyframePoint } from '/@/models/keyframe'
import * as target from '/@/utils/keyframes/keyframeBone'

describe('utils/keyframes/index.ts', () => {
  describe('interpolateKeyframe', () => {
    it('translate', () => {
      expect(
        target.interpolateKeyframe(
          [
            getKeyframeBone({
              frame: 0,
              points: {
                translateX: { value: 10, curve: getCurve('linear') },
                translateY: { value: 20, curve: getCurve('linear') },
              },
            }),
            getKeyframeBone({
              frame: 1,
              points: {
                translateX: { value: 100, curve: getCurve('linear') },
                translateY: { value: 200, curve: getCurve('linear') },
              },
            }),
            getKeyframeBone({
              frame: 2,
            }),
            getKeyframeBone({
              frame: 4,
            }),
            getKeyframeBone({
              frame: 5,
              points: {
                translateX: { value: 1000, curve: getCurve('linear') },
                translateY: { value: 2000, curve: getCurve('linear') },
              },
            }),
          ],
          3
        )
      ).toEqual(getTransform({ translate: { x: 550, y: 1100 } }))
    })
    it('rotate', () => {
      expect(
        target.interpolateKeyframe(
          [
            getKeyframeBone({
              frame: 0,
              points: {
                rotate: { value: 10, curve: getCurve('linear') },
              },
            }),
            getKeyframeBone({
              frame: 1,
              points: {
                rotate: { value: 100, curve: getCurve('linear') },
              },
            }),
            getKeyframeBone({
              frame: 2,
            }),
            getKeyframeBone({
              frame: 4,
            }),
            getKeyframeBone({
              frame: 5,
              points: {
                rotate: { value: 1000, curve: getCurve('linear') },
              },
            }),
          ],
          3
        )
      ).toEqual(getTransform({ rotate: 550 }))
    })
    it('scale', () => {
      expect(
        target.interpolateKeyframe(
          [
            getKeyframeBone({
              frame: 0,
              points: {
                scaleX: { value: 10, curve: getCurve('linear') },
                scaleY: { value: 20, curve: getCurve('linear') },
              },
            }),
            getKeyframeBone({
              frame: 1,
              points: {
                scaleX: { value: 100, curve: getCurve('linear') },
                scaleY: { value: 200, curve: getCurve('linear') },
              },
            }),
            getKeyframeBone({
              frame: 2,
            }),
            getKeyframeBone({
              frame: 4,
            }),
            getKeyframeBone({
              frame: 5,
              points: {
                scaleX: { value: 1000, curve: getCurve('linear') },
                scaleY: { value: 2000, curve: getCurve('linear') },
              },
            }),
          ],
          3
        )
      ).toEqual(getTransform({ scale: { x: 550, y: 1100 } }))
    })
  })

  describe('makeKeyframe', () => {
    it('should return a keyframe', () => {
      expect(
        target.makeKeyframe(1, 'a', getTransform({ rotate: 10 }), {
          useRotate: true,
        })
      ).toEqual(
        getKeyframeBone({
          frame: 1,
          targetId: 'a',
          points: { rotate: getKeyframePoint({ value: 10 }) },
        })
      )
    })
    it('should let a keyframe have the point for translate', () => {
      const ret = target.makeKeyframe(
        1,
        'a',
        getTransform({ translate: { x: 1, y: 2 } }),
        { useTranslate: true }
      )
      expect(ret.points.translateX?.value).toBe(1)
      expect(ret.points.translateY?.value).toBe(2)
    })
    it('should let a keyframe have the point for rotate', () => {
      expect(
        target.makeKeyframe(1, 'a', getTransform({ rotate: 10 }), {
          useRotate: true,
        }).points.rotate?.value
      ).toBe(10)
    })
    it('should let a keyframe have the point for scale', () => {
      const ret = target.makeKeyframe(
        1,
        'a',
        getTransform({ scale: { x: 1, y: 2 } }),
        { useScale: true }
      )
      expect(ret.points.scaleX?.value).toBe(1)
      expect(ret.points.scaleY?.value).toBe(2)
    })
    it('should generate id if the flag is true', () => {
      expect(
        target.makeKeyframe(1, 'a', getTransform(), { useScale: true }, false)
          .id
      ).toBe('')
      expect(
        target.makeKeyframe(1, 'a', getTransform(), { useScale: true }, true).id
      ).not.toBe('')
    })
  })
})
