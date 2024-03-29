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

import { getCurve, getKeyframeBone, getKeyframePoint } from '/@/models/keyframe'
import {
  controlToPoint,
  getCurves,
  moveCurveControls,
  moveCurveControlsMap,
  pointToControl,
  toPoint,
} from '/@/utils/graphCurves'
import { frameWidth } from '/@/models'
import { assertVec } from 'spec/tools'
import { getNorm, getRadian } from 'okageo'

describe('src/utils/graphCurves.ts', () => {
  describe('toPoint', () => {
    it('should convert axes { frame, value } => graph canvas', () => {
      expect(toPoint(getKeyframePoint({ value: 2 }), 3, 10)).toEqual({
        x: 3 * frameWidth,
        y: 20,
      })
    })
  })

  describe('controlToPoint', () => {
    it('should convert axes curve control => graph canvas', () => {
      expect(controlToPoint({ x: 3, y: 2 }, 10)).toEqual({
        x: 3 * frameWidth,
        y: 20,
      })
    })
  })

  describe('pointToControl', () => {
    it('should convert axes graph canvas => curve control', () => {
      expect(pointToControl({ x: 3 * frameWidth, y: 20 }, 10)).toEqual({
        x: 3,
        y: 2,
      })
    })
  })

  describe('getCurves', () => {
    it('single point', () => {
      const ret = getCurves({
        keyframes: [
          getKeyframeBone({
            id: 'a',
            points: { translateX: getKeyframePoint() },
          }),
        ],
        selectedStateMap: { a: { props: {} } },
        pointKey: 'translateX',
        valueWidth: 10,
      })
      expect(ret).toEqual({
        a: {
          first: true,
          from: { x: 0, y: 0 },
          id: 'a',
          keyframeName: 'bone',
          last: true,
          name: 'linear',
          selected: false,
        },
      })
    })
    it('multi point', () => {
      const ret = getCurves({
        keyframes: [
          getKeyframeBone({
            id: 'a',
            frame: 1,
            points: { translateX: getKeyframePoint() },
          }),
          getKeyframeBone({
            id: 'b',
            frame: 2,
            points: { translateX: getKeyframePoint() },
          }),
          getKeyframeBone({
            id: 'c',
            frame: 3,
            points: { translateX: getKeyframePoint() },
          }),
        ],
        selectedStateMap: {},
        pointKey: 'translateX',
        valueWidth: 10,
      })
      expect(ret).toEqual({
        a: {
          id: 'a',
          keyframeName: 'bone',
          from: { x: 1 * frameWidth, y: 0 },
          to: { x: 2 * frameWidth, y: 0 },
          first: true,
          last: false,
          name: 'linear',
          selected: false,
        },
        b: {
          id: 'b',
          keyframeName: 'bone',
          name: 'linear',
          from: { x: 2 * frameWidth, y: 0 },
          to: { x: 3 * frameWidth, y: 0 },
          first: false,
          last: false,
          selected: false,
        },
        c: {
          id: 'c',
          keyframeName: 'bone',
          name: 'linear',
          from: { x: 3 * frameWidth, y: 0 },
          first: false,
          last: true,
          selected: false,
        },
      })
    })
    it('extend keypoint selected status', () => {
      const ret = getCurves({
        keyframes: [
          getKeyframeBone({
            id: 'a',
            points: { translateX: getKeyframePoint() },
          }),
          getKeyframeBone({
            id: 'b',
            points: { translateX: getKeyframePoint() },
          }),
          getKeyframeBone({
            id: 'c',
            points: { translateX: getKeyframePoint() },
          }),
        ],
        selectedStateMap: {
          a: { props: { translateX: true } },
          b: { props: {} },
        },
        pointKey: 'translateX',
        valueWidth: 10,
      })
      expect(ret.a.selected).toBe(true)
      expect(ret.b.selected).toBe(false)
    })
    it('should let points surrounded by bezier3 points have bezier3 controls', () => {
      const ret = getCurves({
        keyframes: [
          getKeyframeBone({
            id: 'a',
            frame: 1,
            points: {
              translateX: getKeyframePoint({
                value: 10,
                curve: getCurve('bezier3'),
              }),
            },
          }),
          getKeyframeBone({
            id: 'b',
            frame: 2,
            points: {
              translateX: getKeyframePoint({
                value: 20,
                curve: getCurve('bezier3'),
              }),
            },
          }),
          getKeyframeBone({
            id: 'c',
            frame: 3,
            points: { translateX: getKeyframePoint({ value: 30 }) },
          }),
        ],
        selectedStateMap: {},
        pointKey: 'translateX',
        valueWidth: 10,
      })

      expect(ret.a.controlIn).toBe(undefined)
      expect(ret.a.controlOut).toEqual({ x: 110, y: 100 })
      expect(ret.a.c1).toEqual({ x: 110, y: 100 })
      expect(ret.a.c2).toEqual({ x: -80, y: 200 })

      expect(ret.b.controlIn).toEqual({ x: -80, y: 200 })
      expect(ret.b.controlOut).toEqual({ x: 120, y: 200 })
      expect(ret.b.c1).toEqual({ x: 120, y: 200 })
      expect(ret.b.c2).toEqual({ x: -70, y: 300 })

      expect(ret.c.controlIn).toEqual({ x: -70, y: 300 })
      expect(ret.c.controlOut).toBe(undefined)
      expect(ret.c.c1).toBe(undefined)
      expect(ret.c.c2).toBe(undefined)
    })
  })

  describe('moveCurveControlsMap', () => {
    it('should move selected controls of curves in map', () => {
      const ret = moveCurveControlsMap(
        {
          a: getKeyframeBone({
            id: 'a',
            points: {
              translateX: getKeyframePoint({
                curve: {
                  ...getCurve('bezier3'),
                  controlIn: { x: -100, y: 200 },
                  controlOut: { x: 100, y: 200 },
                },
              }),
            },
          }),
          b: getKeyframeBone({
            id: 'b',
            points: {
              translateX: getKeyframePoint(),
            },
          }),
        },
        {
          a: { translateX: { controlIn: true } },
          c: { translateX: { controlIn: true } },
        },
        { x: 10, y: 20 }
      )
      expect(ret.a.points.translateX.curve.controlIn).toEqual({
        x: -90,
        y: 220,
      })
      expect(ret.b).toBe(undefined)
      expect(ret.c).toBe(undefined)
    })
  })

  describe('moveCurveControls', () => {
    const keyframe = getKeyframeBone({
      frame: 1,
      points: {
        translateX: getKeyframePoint({
          value: 2,
          curve: {
            ...getCurve('bezier3'),
            controlIn: { x: -100, y: 200 },
            controlOut: { x: 100, y: 200 },
          },
        }),
        translateY: getKeyframePoint({
          value: 2,
          curve: getCurve('bezier3'),
        }),
      },
    })

    describe('should move selected controls of curves', () => {
      it('controlIn', () => {
        const ret = moveCurveControls(
          keyframe,
          { translateX: { controlIn: true } },
          { x: 10, y: 20 }
        )
        assertVec(ret.points.translateX.curve.controlIn, { x: -90, y: 220 })
        assertVec(ret.points.translateX.curve.controlOut, { x: 100, y: 200 })
      })
      it('controlOut', () => {
        const ret = moveCurveControls(
          keyframe,
          { translateX: { controlOut: true } },
          { x: 10, y: 20 }
        )
        assertVec(ret.points.translateX.curve.controlIn, { x: -100, y: 200 })
        assertVec(ret.points.translateX.curve.controlOut, { x: 110, y: 220 })
      })
    })

    describe('symmetrize', () => {
      it('based on "controlIn": should move "controlOut" control symmetrically', () => {
        const ret = moveCurveControls(
          keyframe,
          { translateX: { controlIn: true } },
          { x: 10, y: 20 },
          true
        )
        assertVec(ret.points.translateX.curve.controlIn, { x: -90, y: 220 })
        expect(getRadian(ret.points.translateX.curve.controlOut)).toBeCloseTo(
          getRadian(ret.points.translateX.curve.controlIn) - Math.PI
        )
        expect(getNorm(ret.points.translateX.curve.controlOut)).toBeCloseTo(
          getNorm({ x: 100, y: 200 })
        )
      })
      it('based on "controlOut": should move "controlIn" control symmetrically', () => {
        const ret = moveCurveControls(
          keyframe,
          { translateX: { controlOut: true } },
          { x: 10, y: 20 },
          true
        )
        assertVec(ret.points.translateX.curve.controlOut, { x: 110, y: 220 })
        expect(getRadian(ret.points.translateX.curve.controlIn)).toBeCloseTo(
          getRadian(ret.points.translateX.curve.controlOut) - Math.PI
        )
        expect(getNorm(ret.points.translateX.curve.controlIn)).toBeCloseTo(
          getNorm({ x: -100, y: 200 })
        )
      })
    })
  })
})
