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
import { interpolateTransform } from '/@/utils/armatures'
import { UNIT_VALUE_TYPES } from '/@/utils/graphNodes/core'
import * as target from '/@/utils/graphNodes/nodes/lerpGenerics'

describe('src/utils/graphNodes/nodes/lerpGenerics.ts', () => {
  describe('computation', () => {
    describe('SCALER', () => {
      it('should return result of lerp from a to b by alpha', () => {
        expect(
          target.struct.computation(
            { a: 1, b: 11, alpha: 0.3 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.SCALER },
                b: { genericsType: UNIT_VALUE_TYPES.SCALER },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: 4 })
      })
      it('should clamp alpha between from 0 to 1', () => {
        expect(
          target.struct.computation(
            { a: 1, b: 11, alpha: -1 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.SCALER },
                b: { genericsType: UNIT_VALUE_TYPES.SCALER },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: 1 })
        expect(
          target.struct.computation(
            { a: 1, b: 11, alpha: 2 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.SCALER },
                b: { genericsType: UNIT_VALUE_TYPES.SCALER },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: 11 })
      })
    })

    describe('VECTOR2', () => {
      it('should return result of lerp from a to b by alpha', () => {
        expect(
          target.struct.computation(
            { a: { x: 1, y: 2 }, b: { x: 11, y: 22 }, alpha: 0.3 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
                b: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
              },
            } as any,

            {} as any
          )
        ).toEqual({ value: { x: 4, y: 8 } })
      })
    })

    describe('COLOR', () => {
      const a = getTransform({
        translate: { x: 1, y: 2 },
        rotate: 3,
        scale: { x: 10, y: 20 },
        origin: { x: 100, y: 200 },
      })
      const b = getTransform({
        translate: { x: 10, y: 20 },
        rotate: 30,
        scale: { x: 100, y: 200 },
        origin: { x: 1000, y: 2000 },
      })
      it('should return result of lerp from a to b by alpha', () => {
        expect(
          target.struct.computation(
            { a, b, alpha: 0.3 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.COLOR },
                b: { genericsType: UNIT_VALUE_TYPES.COLOR },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: interpolateTransform(a, b, 0.3) })
      })
    })

    describe('TRANSFORM', () => {
      const a = getTransform({
        translate: { x: 1, y: 2 },
        rotate: 3,
        scale: { x: 10, y: 20 },
        origin: { x: 100, y: 200 },
      })
      const b = getTransform({
        translate: { x: 10, y: 20 },
        rotate: 30,
        scale: { x: 100, y: 200 },
        origin: { x: 1000, y: 2000 },
      })
      it('should return result of lerp from a to b by alpha', () => {
        expect(
          target.struct.computation(
            { a, b, alpha: 0.3 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.TRANSFORM },
                b: { genericsType: UNIT_VALUE_TYPES.TRANSFORM },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: interpolateTransform(a, b, 0.3) })
      })
    })
  })

  describe('getErrors', () => {
    it('should return errors if the node has invalid generics types', () => {
      expect(
        target.struct.getErrors!({
          inputs: {
            a: { genericsType: UNIT_VALUE_TYPES.OBJECT },
            b: { genericsType: UNIT_VALUE_TYPES.OBJECT },
          },
        } as any)
      ).toEqual(['invalid type to operate'])
    })
    it('should return undefined if the node does not have invalid generics types', () => {
      expect(
        target.struct.getErrors!({
          inputs: {
            a: { genericsType: UNIT_VALUE_TYPES.SCALER },
            b: { genericsType: UNIT_VALUE_TYPES.SCALER },
          },
        } as any)
      ).toBe(undefined)
    })
  })
})
