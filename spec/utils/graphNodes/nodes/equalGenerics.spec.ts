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

import { UNIT_VALUE_TYPES } from '/@/utils/graphNodes/core'
import * as target from '/@/utils/graphNodes/nodes/equalGenerics'

describe('src/utils/graphNodes/nodes/equalGenerics.ts', () => {
  describe('computation', () => {
    describe('should return result of a equals b', () => {
      it('type: SCALER', () => {
        expect(
          target.struct.computation(
            { a: 1, b: 1, threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.SCALER },
                b: { genericsType: UNIT_VALUE_TYPES.SCALER },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: true })
        expect(
          target.struct.computation(
            { a: 1, b: 10, threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.SCALER },
                b: { genericsType: UNIT_VALUE_TYPES.SCALER },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: false })
        expect(
          target.struct.computation(
            { a: 1, b: 10, threshold: 9 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.SCALER },
                b: { genericsType: UNIT_VALUE_TYPES.SCALER },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: true })
        expect(
          target.struct.computation(
            { a: undefined, b: undefined, threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.SCALER },
                b: { genericsType: UNIT_VALUE_TYPES.SCALER },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: true })
      })
      it('type: VECTOR2', () => {
        expect(
          target.struct.computation(
            { a: { x: 1, y: 2 }, b: { x: 1, y: 2 }, threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
                b: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: true })
        expect(
          target.struct.computation(
            { a: { x: 2, y: 2 }, b: { x: 1, y: 2 }, threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
                b: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: false })
        expect(
          target.struct.computation(
            { a: { x: 2, y: 2 }, b: { x: 1, y: 2 }, threshold: 1 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
                b: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: true })
        expect(
          target.struct.computation(
            { a: undefined, b: undefined, threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
                b: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: true })
      })
      it('type: TEXT', () => {
        expect(
          target.struct.computation(
            { a: 'a', b: 'a', threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.TEXT },
                b: { genericsType: UNIT_VALUE_TYPES.TEXT },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: true })
        expect(
          target.struct.computation(
            { a: 'a', b: 'b', threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.TEXT },
                b: { genericsType: UNIT_VALUE_TYPES.TEXT },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: false })
        expect(
          target.struct.computation(
            { a: undefined, b: undefined, threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.TEXT },
                b: { genericsType: UNIT_VALUE_TYPES.TEXT },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: true })
      })
      it('type: BOOLEAN', () => {
        expect(
          target.struct.computation(
            { a: true, b: true, threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.BOOLEAN },
                b: { genericsType: UNIT_VALUE_TYPES.BOOLEAN },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: true })
        expect(
          target.struct.computation(
            { a: false, b: true, threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.BOOLEAN },
                b: { genericsType: UNIT_VALUE_TYPES.BOOLEAN },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: false })
        expect(
          target.struct.computation(
            { a: undefined, b: undefined, threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.BOOLEAN },
                b: { genericsType: UNIT_VALUE_TYPES.BOOLEAN },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: true })
      })
      it('type: OBJECT', () => {
        expect(
          target.struct.computation(
            { a: 'a', b: 'a', threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.OBJECT },
                b: { genericsType: UNIT_VALUE_TYPES.OBJECT },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: true })
        expect(
          target.struct.computation(
            { a: 'a', b: 'b', threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.OBJECT },
                b: { genericsType: UNIT_VALUE_TYPES.OBJECT },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: false })
        expect(
          target.struct.computation(
            { a: undefined, b: undefined, threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.OBJECT },
                b: { genericsType: UNIT_VALUE_TYPES.OBJECT },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: true })
      })
      it('type: invalid', () => {
        expect(
          target.struct.computation(
            { a: 'a', b: 'b', threshold: 0 },
            {
              inputs: {
                a: { genericsType: UNIT_VALUE_TYPES.GENERICS },
                b: { genericsType: UNIT_VALUE_TYPES.GENERICS },
              },
            } as any,
            {} as any
          )
        ).toEqual({ value: false })
      })
    })
  })

  describe('getErrors', () => {
    it('should return errors if the node has invalid generics types', () => {
      expect(
        target.struct.getErrors!({
          inputs: {
            a: { genericsType: UNIT_VALUE_TYPES.COLOR },
            b: { genericsType: UNIT_VALUE_TYPES.COLOR },
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
