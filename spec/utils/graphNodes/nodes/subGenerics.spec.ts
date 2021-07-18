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
import { UNIT_VALUE_TYPES } from '/@/utils/graphNodes/core'
import * as target from '/@/utils/graphNodes/nodes/subGenerics'

describe('src/utils/graphNodes/nodes/subGenerics.ts', () => {
  describe('computation', () => {
    describe('should return result of a - b', () => {
      it('type: SCALER', () => {
        expect(
          target.struct.computation(
            { a: 11, b: 1 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.SCALER },
                b: { genericsType: UNIT_VALUE_TYPES.SCALER },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: 10 })
        expect(
          target.struct.computation(
            { a: undefined, b: undefined },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.SCALER },
                b: { genericsType: UNIT_VALUE_TYPES.SCALER },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: 0 })
      })
      it('type: VECTOR2', () => {
        expect(
          target.struct.computation(
            { a: { x: 11, y: 22 }, b: { x: 1, y: 2 } },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
                b: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: { x: 10, y: 20 } })
        expect(
          target.struct.computation(
            { a: undefined, b: undefined },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
                b: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: { x: 0, y: 0 } })
      })
      it('type: TRANSFORM', () => {
        expect(
          target.struct.computation(
            {
              a: getTransform({ rotate: 11 }),
              b: getTransform({ rotate: 1 }),
            },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.TRANSFORM },
                b: { genericsType: UNIT_VALUE_TYPES.TRANSFORM },
              },
            } as any,
            {} as any
          )
        ).toEqual({
          value: getTransform({ rotate: 10, scale: { x: 0, y: 0 } }),
        })
        expect(
          target.struct.computation(
            { a: undefined, b: undefined },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.TRANSFORM },
                b: { genericsType: UNIT_VALUE_TYPES.TRANSFORM },
              },
            } as any,
            {} as any
          )
        ).toEqual({
          value: getTransform({ scale: { x: 0, y: 0 } }),
        })
      })
      it('type: invalid', () => {
        expect(
          target.struct.computation(
            { a: 'a', b: 'b' },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.OBJECT },
                b: { genericsType: UNIT_VALUE_TYPES.OBJECT },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: undefined })
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
