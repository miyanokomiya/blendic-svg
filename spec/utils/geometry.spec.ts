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

import { getBone, getTransform, scaleRate } from '/@/models'
import {
  applyScale,
  applyTransform,
  applyTransformToVec,
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
} from '/@/utils/geometry'

describe('src/utils/geometry.ts', () => {
  describe('normalizeRad', () => {
    it.each([
      [0, 0],
      [Math.PI, Math.PI],
      [Math.PI / 2, Math.PI / 2],
      [Math.PI * 1.5, -Math.PI * 0.5],
      [-Math.PI * 1.5, Math.PI * 0.5],
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
      [135, 225, 90],
      [180, 270, 90],
    ])('%s, %s => %s', (a, b, expected) => {
      expect(
        getContinuousRadDiff((a / 180) * Math.PI, (b / 180) * Math.PI)
      ).toBeCloseTo((expected / 180) * Math.PI)
    })
    it.each([
      [45, -45, -90],
      [0, -90, -90],
      [-45, -135, -90],
      [-90, -180, -90],
      [-135, -225, -90],
      [-180, -270, -90],
    ])('%s, %s => %s', (a, b, expected) => {
      expect(
        getContinuousRadDiff((a / 180) * Math.PI, (b / 180) * Math.PI)
      ).toBeCloseTo((expected / 180) * Math.PI)
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
            transform: getTransform({
              translate: { x: 10, y: 20 },
            }),
          })
        )
      ).toEqual({ x: 11, y: 22 })
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
})
