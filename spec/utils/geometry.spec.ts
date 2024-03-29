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

import { assertVec } from 'spec/tools'
import { getBone, getTransform, scaleRate } from '/@/models'
import {
  applyScale,
  applyTransform,
  applyPosedTransformToPoint,
  applyTransformToVec,
  logRound,
  logRoundByDigit,
  getBoneBodyRotation,
  getBoneWorldLocation,
  getBoneWorldRotation,
  getContinuousRadDiff,
  getGridSize,
  getNormalRectangle,
  invertScaleOrZero,
  isSameTransform,
  normalizeRad,
  snapGrid,
  snapNumber,
  snapRotate,
  snapScale,
  transformRect,
  isIdentityAffine,
  mapVec,
  isIdentityTransform,
  getBoneSquaredSize,
  transformToAffine,
  getIsRectInRectFn,
  getIsRectHitRectFn,
  getTornadoTransformFn,
  getCircleTransformFn,
  getGridTransformFn,
  getBoneXRadian,
  getBoneWorldTranslate,
  toBoneSpaceFn,
  snapAxisGrid,
  snapPlainGrid,
  gridRound,
  isOppositeSide,
  getWrapperRect,
  expandRect,
  symmetrizeRotate,
} from '/@/utils/geometry'

describe('src/utils/geometry.ts', () => {
  describe('logRound', () => {
    it.each([
      [0, 0.111, 0],
      [-1, 0.111, 0.1],
      [-2, 0.111, 0.11],
      [-2, 0.666, 0.67],
      [0, 111, 111],
      [1, 111, 110],
      [2, 111, 100],
      [2, 666, 700],
    ])('logRound(%s, %s) => %s', (decimal, val, expected) => {
      expect(logRound(decimal, val)).toBe(expected)
    })
  })

  describe('logRoundByDigit', () => {
    it.each([
      [0, 123.456, 123],
      [3, 123.456, 123],
      [4, 123.456, 123.5],
      [5, 123.456, 123.46],
      [6, 123.456, 123.456],
      [7, 123.456, 123.456],
      [2, 1.45678, 1.5],
      [3, 1.45678, 1.46],
      [4, -123.456, -123.5],
    ])('logRoundByDigit(%s, %s) => %s', (digitCount, val, expected) => {
      expect(logRoundByDigit(digitCount, val)).toBe(expected)
    })
  })

  describe('gridRound', () => {
    it.each([
      [10, 14, 10],
      [10, 16, 20],
      [10, -14, -10],
      [10, -16, -20],
    ])('gridRound(%s, %s) => %s', (size, val, expected) => {
      expect(gridRound(size, val)).toBe(expected)
    })
  })

  describe('normalizeRad', () => {
    it.each([
      [0, 0],
      [Math.PI, Math.PI],
      [Math.PI / 2, Math.PI / 2],
      [Math.PI * 1.5, -Math.PI * 0.5],
      [Math.PI * 3.5, Math.PI * -0.5],
      [Math.PI * 1.8, Math.PI * -0.2],
      [-Math.PI * -1.5, -Math.PI * 0.5],
    ])('normalizeRad(%s) => %s', (a, expected) => {
      expect(normalizeRad(a)).toBeCloseTo(expected)
    })
  })

  describe('getContinuousRadDiff', () => {
    it.each([
      [-45, 45, 90],
      [0, 90, 90],
      [45, 135, 90],
      [90, 180, 90],
      [90, -180, 90],
      [135, -135, 90],
      [155, -115, 90],
      [180, -90, 90],
      [880, -160, 40],
    ])('%s, %s => %s', (a, b, expected) => {
      expect(
        (getContinuousRadDiff((a / 180) * Math.PI, (b / 180) * Math.PI) * 180) /
          Math.PI
      ).toBeCloseTo(expected)
    })
    it.each([
      [45, -45, -90],
      [0, -90, -90],
      [-45, -135, -90],
      [-90, -180, -90],
      [-135, -225, -90],
      [-155, -245, -90],
      [-180, -270, -90],
    ])('%s, %s => %s', (a, b, expected) => {
      expect(
        getContinuousRadDiff((a / 180) * Math.PI, (b / 180) * Math.PI)
      ).toBeCloseTo((expected / 180) * Math.PI)
    })
    it.each([
      [-35, 175, -150],
      [35, -175, 150],
    ])('%s, %s => %s', (a, b, expected) => {
      expect(
        getContinuousRadDiff((a / 180) * Math.PI, (b / 180) * Math.PI)
      ).toBeCloseTo((expected / 180) * Math.PI)
    })
  })

  describe('mapVec', () => {
    it('convert axes value of vector by each functions', () => {
      expect(
        mapVec(
          { x: 2, y: 3 },
          (val) => val * val,
          (val) => val * 10
        )
      ).toEqual({ x: 4, y: 30 })
    })
    it('convert axes value of vector by a function', () => {
      expect(mapVec({ x: 2, y: 3 }, (val) => val * val)).toEqual({ x: 4, y: 9 })
    })
  })

  describe('isIdentityTransform', () => {
    it('should return true if it is identity', () => {
      expect(isIdentityTransform(getTransform())).toBe(true)
    })
    it('should return false if it is not identity', () => {
      expect(isIdentityTransform(getTransform({ rotate: 1 }))).toBe(false)
    })
  })

  describe('isSameTransform', () => {
    it('return true if two transforms are same', () => {
      const t = getTransform({
        translate: { x: 1, y: 2 },
        scale: { x: 10, y: 20 },
        origin: { x: 100, y: 200 },
        rotate: 45,
      })
      expect(isSameTransform(getTransform(t), getTransform(t))).toBe(true)
    })
    it('return false if different translate', () => {
      expect(
        isSameTransform(
          getTransform({ translate: { x: 1, y: 2 } }),
          getTransform({ translate: { x: 2, y: 2 } })
        )
      ).toBe(false)
    })
    it('return false if different scale', () => {
      expect(
        isSameTransform(
          getTransform({ scale: { x: 1, y: 2 } }),
          getTransform({ scale: { x: 2, y: 2 } })
        )
      ).toBe(false)
    })
    it('return false if different origin', () => {
      expect(
        isSameTransform(
          getTransform({ origin: { x: 1, y: 2 } }),
          getTransform({ origin: { x: 2, y: 2 } })
        )
      ).toBe(false)
    })
    it('return false if different rotate', () => {
      expect(
        isSameTransform(
          getTransform({ rotate: 10 }),
          getTransform({ rotate: 20 })
        )
      ).toBe(false)
    })
  })

  describe('getGridSize', () => {
    it.each([
      [Math.pow(scaleRate, 1), 10],
      [Math.pow(scaleRate, 4), 10],
      [Math.pow(scaleRate, 5), 20],
      [Math.pow(scaleRate, 10), 50],
      [Math.pow(scaleRate, 11), 100],
    ])('scale: %s => %s', (scale, expected) => {
      expect(getGridSize(scale)).toBe(expected)
    })
  })

  describe('snapGrid', () => {
    it.each([
      [1, { x: 1, y: 1 }, { x: 0, y: 0 }],
      [1, { x: 6, y: 6 }, { x: 10, y: 10 }],
      [1, { x: 14, y: 14 }, { x: 10, y: 10 }],
      [1, { x: 16, y: 16 }, { x: 20, y: 20 }],
      [1, { x: 16, y: 6 }, { x: 20, y: 10 }],
      [1, { x: -16, y: -6 }, { x: -20, y: -10 }],
    ])('scale: %s vec: %s => %s', (scale, vec, expected) => {
      expect(snapGrid(scale, vec)).toEqual(expected)
    })
  })

  describe('snapRotate', () => {
    it.each([
      [0, 0],
      [7, 0],
      [8, 15],
      [22, 15],
      [23, 30],
    ])('rotate: %s => %s', (rotate, expected) => {
      expect(snapRotate(rotate)).toBe(expected)
    })
    it('option angle', () => {
      expect(snapRotate(19, 20)).toBe(20)
    })
  })

  describe('snapScale', () => {
    it.each([
      [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
      [
        { x: 0.06, y: 0.04 },
        { x: 0.1, y: 0 },
      ],
    ])('scale: %s => %s', (scale, expected) => {
      expect(snapScale(scale)).toEqual(expected)
    })
  })

  describe('snapNumber', () => {
    it.each([
      [0, 0],
      [0.4, 0],
      [0.5, 1],
    ])('value: %s => %s', (value, expected) => {
      expect(snapNumber(value)).toBe(expected)
    })
    it('option angle', () => {
      expect(snapNumber(19, 20)).toBe(20)
    })
  })

  describe('getNormalRectangle', () => {
    it('get the same rectangle if it has positive width and height', () => {
      expect(
        getNormalRectangle({
          x: 0,
          y: 0,
          width: 1,
          height: 2,
        })
      ).toEqual({
        x: 0,
        y: 0,
        width: 1,
        height: 2,
      })
    })
    it('get reversed rectangle if it has negative width or height', () => {
      expect(
        getNormalRectangle({
          x: 0,
          y: 0,
          width: -1,
          height: -2,
        })
      ).toEqual({
        x: -1,
        y: -2,
        width: 1,
        height: 2,
      })
    })
  })

  describe('getBoneBodyRotation', () => {
    it('get bone body rotation', () => {
      expect(
        getBoneBodyRotation(
          getBone({
            head: { x: 0, y: 1 },
            tail: { x: 1, y: 2 },
            transform: getTransform({
              rotate: 10,
            }),
          })
        )
      ).toBeCloseTo(45)
    })
  })

  describe('getBoneWorldRotation', () => {
    it('get bone world rotation', () => {
      expect(
        getBoneWorldRotation(
          getBone({
            head: { x: 0, y: 1 },
            tail: { x: 1, y: 2 },
            transform: getTransform({
              rotate: 10,
            }),
          })
        )
      ).toBeCloseTo(55)
    })
  })

  describe('getBoneWorldLocation', () => {
    it('get bone world location', () => {
      expect(
        getBoneWorldLocation(
          getBone({
            head: { x: 1, y: 2 },
            tail: { x: 1, y: 3 },
            transform: getTransform({
              translate: { x: 10, y: 20 },
            }),
          })
        )
      ).toEqual({ x: 11, y: 22 })
    })
  })

  describe('getBoneXRadian', () => {
    it("get radian of the bone's x axis", () => {
      expect(
        getBoneXRadian(
          getBone({
            head: { x: 1, y: 2 },
            tail: { x: 1, y: 3 },
          })
        )
      ).toBeCloseTo(0)
      expect(
        getBoneXRadian(
          getBone({
            head: { x: 1, y: 2 },
            tail: { x: -1, y: 2 },
          })
        )
      ).toBeCloseTo(Math.PI / 2)
    })
  })

  describe('getBoneWorldTranslate', () => {
    it('get world translate of the bone', () => {
      assertVec(
        getBoneWorldTranslate(
          getBone({
            head: { x: 1, y: 2 },
            tail: { x: 1, y: 3 },
            transform: getTransform({
              translate: { x: 1, y: 0 },
            }),
          })
        ),
        { x: 1, y: 0 }
      )
      assertVec(
        getBoneWorldTranslate(
          getBone({
            head: { x: 1, y: 2 },
            tail: { x: -1, y: 2 },
            transform: getTransform({
              translate: { x: 1, y: 0 },
            }),
          })
        ),
        { x: 0, y: 1 }
      )
    })
  })

  describe('toBoneSpaceFn', () => {
    it('get functions to convert world or local translate of the bone', () => {
      const ret1 = toBoneSpaceFn(
        getBone({
          head: { x: 1, y: 2 },
          tail: { x: 1, y: 3 },
          transform: getTransform({
            translate: { x: 1, y: 0 },
          }),
        })
      )
      assertVec(ret1.toWorld({ x: 1, y: 0 }), { x: 1, y: 0 })
      assertVec(ret1.toLocal({ x: 1, y: 0 }), { x: 1, y: 0 })

      const ret2 = toBoneSpaceFn(
        getBone({
          head: { x: 1, y: 2 },
          tail: { x: -1, y: 2 },
          transform: getTransform({
            translate: { x: 1, y: 0 },
          }),
        })
      )
      assertVec(ret2.toWorld({ x: 1, y: 0 }), { x: 0, y: 1 })
      assertVec(ret2.toLocal({ x: 0, y: 1 }), { x: 1, y: 0 })
    })
  })

  describe('getBoneSquaredSize', () => {
    it('should return squared distance between the head and the tail', () => {
      expect(
        getBoneSquaredSize(
          getBone({
            head: { x: 1, y: 2 },
            tail: { x: 3, y: 5 },
          })
        )
      ).toBe(13)
    })
  })

  describe('applyScale', () => {
    it('apply scale x and y', () => {
      expect(applyScale({ x: 10, y: 2 }, { x: -2, y: 3 })).toEqual({
        x: -20,
        y: 6,
      })
    })
  })

  describe('invertScaleOrZero', () => {
    it('return zero vector if scale is zero', () => {
      expect(invertScaleOrZero({ x: 0, y: 0 })).toEqual({
        x: 0,
        y: 0,
      })
    })
    it('return inverted each axis vector if scale is not zero', () => {
      expect(invertScaleOrZero({ x: 2, y: 3 })).toEqual({
        x: 1 / 2,
        y: 1 / 3,
      })
    })
  })

  describe('applyTransform', () => {
    it('apply scale -> rotate -> translate', () => {
      const ret = applyTransform(
        { x: 1, y: 0 },
        getTransform({
          rotate: 90,
          scale: { x: 2, y: 1 },
          translate: { x: 1, y: 2 },
        })
      )
      expect(ret.x).toBeCloseTo(1)
      expect(ret.y).toBeCloseTo(4)
    })
  })

  describe('applyPosedTransformToPoint', () => {
    it('apply parent bone scale', () => {
      const parent = getBone({
        head: { x: 1, y: 1 },
        tail: { x: 2, y: 1 },
        transform: getTransform({
          scale: { x: 2, y: 3 },
        }),
      })
      expect(applyPosedTransformToPoint(parent, { x: 3, y: 2 })).toEqual({
        x: 7,
        y: 3,
      })
    })
  })

  describe('applyTransformToVec', () => {
    it('apply scale -> rotate', () => {
      const ret = applyTransformToVec(
        { x: 1, y: 0 },
        getTransform({
          rotate: 90,
          scale: { x: 2, y: 1 },
          translate: { x: 1, y: 2 },
        })
      )
      expect(ret.x).toBeCloseTo(0)
      expect(ret.y).toBeCloseTo(2)
    })
  })

  describe('transformRect', () => {
    it('traslate', () => {
      expect(
        transformRect(
          { x: 0, y: 0, width: 1, height: 2 },
          getTransform({
            translate: { x: 1, y: 2 },
          })
        )
      ).toEqual({
        x: 1,
        y: 2,
        width: 1,
        height: 2,
      })
    })
    it('scale', () => {
      expect(
        transformRect(
          { x: 0, y: 0, width: 1, height: 1 },
          getTransform({
            scale: { x: 10, y: 20 },
          })
        )
      ).toEqual({
        x: 0,
        y: 0,
        width: 10,
        height: 20,
      })
    })
    it('scale with origin', () => {
      expect(
        transformRect(
          { x: 0, y: 0, width: 1, height: 2 },
          getTransform({
            scale: { x: 2, y: 4 },
            origin: { x: 2, y: 4 },
          })
        )
      ).toEqual({
        x: -2,
        y: -12,
        width: 2,
        height: 8,
      })
    })
    it('ignore rotate', () => {
      expect(
        transformRect(
          { x: 0, y: 0, width: 1, height: 1 },
          getTransform({
            rotate: 90,
          })
        )
      ).toEqual({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      })
    })
  })

  describe('isIdentityAffine', () => {
    it('return true if it is identy affine', () => {
      expect(isIdentityAffine([1, 0, 0, 1, 0, 0])).toBe(true)
    })
    it('return false if it is not identy affine', () => {
      expect(isIdentityAffine([2, 0, 0, 1, 0, 0])).toBe(false)
    })
  })

  describe('transformToAffine', () => {
    it('return affine matrix', () => {
      expect(
        transformToAffine(
          getTransform({
            translate: { x: 1, y: 2 },
          })
        )
      ).toEqual([1, 0, 0, 1, 1, 2])
      expect(
        transformToAffine(
          getTransform({
            scale: { x: 10, y: 20 },
          })
        )
      ).toEqual([10, 0, 0, 20, 0, 0])
      const ret = transformToAffine(getTransform({ rotate: 90 }))
      expect(ret[0]).toBeCloseTo(0)
      expect(ret[1]).toBeCloseTo(1)
      expect(ret[2]).toBeCloseTo(-1)
      expect(ret[3]).toBeCloseTo(0)
      expect(ret[4]).toBeCloseTo(0)
      expect(ret[5]).toBeCloseTo(0)
    })
  })

  describe('getIsRectInRectFn', () => {
    const isRectInRect = getIsRectInRectFn({
      x: 0,
      y: 0,
      width: 10,
      height: 20,
    })
    it('should return true if target is in the range', () => {
      expect(isRectInRect({ x: 0, y: 0, width: 10, height: 20 })).toBe(true)
    })
    it('should return false if target is not in the range', () => {
      expect(isRectInRect({ x: -1, y: 0, width: 10, height: 20 })).toBe(false)
      expect(isRectInRect({ x: 0, y: -1, width: 10, height: 20 })).toBe(false)
      expect(isRectInRect({ x: 0, y: 0, width: 11, height: 20 })).toBe(false)
      expect(isRectInRect({ x: 0, y: 0, width: 10, height: 21 })).toBe(false)
    })
  })

  describe('getIsRectHitRectFn', () => {
    const isRectHitRect = getIsRectHitRectFn({
      x: 0,
      y: 0,
      width: 10,
      height: 20,
    })
    it('should return true if target hits the range', () => {
      expect(isRectHitRect({ x: -1, y: -1, width: 2, height: 40 })).toBe(true)
      expect(isRectHitRect({ x: 1, y: -1, width: 40, height: 40 })).toBe(true)
    })
    it('should return false if target does not hit the range', () => {
      expect(isRectHitRect({ x: -2, y: 1, width: 1, height: 20 })).toBe(false)
      expect(isRectHitRect({ x: 11, y: 1, width: 1, height: 20 })).toBe(false)
      expect(isRectHitRect({ x: 1, y: -2, width: 20, height: 1 })).toBe(false)
      expect(isRectHitRect({ x: 1, y: 21, width: 20, height: 1 })).toBe(false)
    })
  })

  describe('getWrapperRect', () => {
    it('should return a rectangle to wrap all rectangles', () => {
      expect(
        getWrapperRect([
          { x: 1, y: 2, width: 10, height: 20 },
          { x: 6, y: 7, width: 10, height: 22 },
        ])
      ).toEqual({ x: 1, y: 2, width: 15, height: 27 })
      expect(
        getWrapperRect([
          { x: 1, y: 2, width: 10, height: 20 },
          { x: 6, y: 7, width: 4, height: 6 },
        ])
      ).toEqual({ x: 1, y: 2, width: 10, height: 20 })
    })
  })

  describe('expandRect', () => {
    it('should return expanded rectangle', () => {
      expect(expandRect({ x: 1, y: 2, width: 10, height: 20 }, 5)).toEqual({
        x: -4,
        y: -3,
        width: 20,
        height: 30,
      })
    })
  })

  describe('getTornadoTransformFn', () => {
    it('should return a transformation of tornado', () => {
      const fn = getTornadoTransformFn(100)
      const t1 = fn(90)
      expect(t1.translate.x).toBeCloseTo(0)
      expect(t1.translate.y).toBeCloseTo(25)
      expect(t1.rotate).toBeCloseTo(90)
      const t2 = fn(360)
      expect(t2.translate.x).toBeCloseTo(100)
      expect(t2.translate.y).toBeCloseTo(0)
      expect(t2.rotate).toBeCloseTo(360)
      const t3 = fn(540)
      expect(t3.translate.x).toBeCloseTo(-150)
      expect(t3.translate.y).toBeCloseTo(0)
      expect(t3.rotate).toBeCloseTo(540)
    })
    it('should slide start rotation', () => {
      const fn = getTornadoTransformFn(100, 90)
      const t1 = fn(90)
      expect(t1.translate.x).toBeCloseTo(-25)
      expect(t1.translate.y).toBeCloseTo(0)
      expect(t1.rotate).toBeCloseTo(180)
    })
    it('should grow radius', () => {
      const fn = getTornadoTransformFn(100, 0, 2)
      const t1 = fn(360)
      expect(t1.translate.x).toBeCloseTo(100)
      expect(t1.translate.y).toBeCloseTo(0)
      expect(t1.rotate).toBeCloseTo(360)
      const t2 = fn(720)
      expect(t2.translate.x).toBeCloseTo(400)
      expect(t2.translate.y).toBeCloseTo(0)
      expect(t2.rotate).toBeCloseTo(720)
      const t3 = fn(1080)
      expect(t3.translate.x).toBeCloseTo(1200)
      expect(t3.translate.y).toBeCloseTo(0)
      expect(t3.rotate).toBeCloseTo(1080)
    })
    it('should grow scale', () => {
      const fn = getTornadoTransformFn(100, 0, 1, 2)
      const t1 = fn(360)
      expect(t1.scale.x).toBeCloseTo(1)
      expect(t1.scale.y).toBeCloseTo(1)
      const t2 = fn(720)
      expect(t2.scale.x).toBeCloseTo(2)
      expect(t2.scale.y).toBeCloseTo(2)
      const t3 = fn(1080)
      expect(t3.scale.x).toBeCloseTo(4)
      expect(t3.scale.y).toBeCloseTo(4)
    })
  })

  describe('getCircleTransformFn', () => {
    it('should return a function to get circle transformation', () => {
      const fn = getCircleTransformFn(4, 100)
      expect(fn(0).translate.x).toBeCloseTo(100)
      expect(fn(0).translate.y).toBeCloseTo(0)
      expect(fn(0).rotate).toBeCloseTo(0)
      expect(fn(1).translate.x).toBeCloseTo(0)
      expect(fn(1).translate.y).toBeCloseTo(100)
      expect(fn(1).rotate).toBeCloseTo(90)
    })
    it('should initialize start rotation', () => {
      const fn = getCircleTransformFn(4, 100, 90)
      expect(fn(0).translate.x).toBeCloseTo(0)
      expect(fn(0).translate.y).toBeCloseTo(100)
      expect(fn(0).rotate).toBeCloseTo(0)
      expect(fn(1).translate.x).toBeCloseTo(-100)
      expect(fn(1).translate.y).toBeCloseTo(0)
      expect(fn(1).rotate).toBeCloseTo(90)
    })
  })

  describe('getGridTransformFn', () => {
    it('should return a function to get grid transformation', () => {
      const fn = getGridTransformFn(10, 20, 3, 2, 0, false)
      expect(fn(0).translate.x).toBeCloseTo(0)
      expect(fn(0).translate.y).toBeCloseTo(0)
      expect(fn(1).translate.x).toBeCloseTo(10)
      expect(fn(1).translate.y).toBeCloseTo(0)
      expect(fn(3).translate.x).toBeCloseTo(0)
      expect(fn(3).translate.y).toBeCloseTo(20)
    })
    it('should rotate', () => {
      const fn = getGridTransformFn(10, 20, 3, 2, 90, false)
      expect(fn(0).translate.x).toBeCloseTo(0)
      expect(fn(0).translate.y).toBeCloseTo(0)
      expect(fn(1).translate.x).toBeCloseTo(0)
      expect(fn(1).translate.y).toBeCloseTo(10)
      expect(fn(3).translate.x).toBeCloseTo(-20)
      expect(fn(3).translate.y).toBeCloseTo(0)
    })
    it('should center if centered is true', () => {
      const fn = getGridTransformFn(10, 20, 3, 2, 0, true)
      expect(fn(0).translate.x).toBeCloseTo(-10)
      expect(fn(0).translate.y).toBeCloseTo(-10)
      expect(fn(1).translate.x).toBeCloseTo(0)
      expect(fn(1).translate.y).toBeCloseTo(-10)
      expect(fn(3).translate.x).toBeCloseTo(-10)
      expect(fn(3).translate.y).toBeCloseTo(10)
    })
  })

  describe('snapAxisGrid', () => {
    it('should snap axis grid', () => {
      assertVec(snapAxisGrid(0, { x: 2, y: 0 }, { x: 1.4, y: 1 }), {
        x: 1.4,
        y: 0,
      })
    })
    it('should round the vector if size is greater than 0', () => {
      assertVec(snapAxisGrid(1, { x: 2, y: 0 }, { x: 1.4, y: 0 }), {
        x: 1,
        y: 0,
      })
      assertVec(snapAxisGrid(1, { x: 2, y: 0 }, { x: 1.6, y: 0 }), {
        x: 2,
        y: 0,
      })
      assertVec(snapAxisGrid(1, { x: 1, y: 0 }, { x: 1, y: 1 }), {
        x: 1,
        y: 0,
      })
      assertVec(snapAxisGrid(1, { x: 1, y: 0 }, { x: 2, y: 1 }), {
        x: 2,
        y: 0,
      })
      assertVec(snapAxisGrid(Math.sqrt(8), { x: 2, y: 2 }, { x: 0, y: 4 }), {
        x: 2,
        y: 2,
      })
    })
    it('in nagative space', () => {
      assertVec(snapAxisGrid(1, { x: 2, y: 0 }, { x: -1.4, y: 0 }), {
        x: -1,
        y: 0,
      })
      assertVec(snapAxisGrid(1, { x: 2, y: 0 }, { x: -1.6, y: 0 }), {
        x: -2,
        y: 0,
      })
    })
  })

  describe('snapPlainGrid', () => {
    it('should snap plain grid', () => {
      assertVec(snapPlainGrid(1, 0, { x: 1.4, y: 0 }), { x: 1, y: 0 })
      assertVec(snapPlainGrid(1, 0, { x: 1.6, y: 0 }), { x: 2, y: 0 })
    })
    it('should snap rotated plain grid', () => {
      assertVec(snapPlainGrid(1, Math.PI / 4, { x: 1, y: 0 }), {
        x: Math.sqrt(2),
        y: 0,
      })
      assertVec(snapPlainGrid(1, Math.PI / 4, { x: 0, y: 1 }), {
        x: 0,
        y: Math.sqrt(2),
      })
    })
  })

  describe('isOppositeSide', () => {
    it('should return true when two points are opposite based at the origin', () => {
      expect(
        isOppositeSide({ x: 10, y: 10 }, { x: 12, y: 12 }, { x: 8, y: 8 })
      ).toBe(true)
      expect(
        isOppositeSide({ x: 10, y: 10 }, { x: 12, y: 12 }, { x: 12, y: 10 })
      ).toBe(false)
    })
  })

  describe('symmetrizeRotate', () => {
    it('should rotate target point making it having symmetric angle', () => {
      assertVec(
        symmetrizeRotate({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: -3, y: -4 }),
        { x: -5, y: 0 }
      )
      assertVec(
        symmetrizeRotate({ x: 1, y: 1 }, { x: 1, y: 11 }, { x: -3, y: -2 }),
        { x: 1, y: -4 }
      )
    })
  })
})
