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
import * as target from '/@/utils/graphNodes/nodes/switch'

describe('src/utils/graphNodes/nodes/switch.ts', () => {
  describe('computation', () => {
    it('should return result if_true if condition is true', () => {
      expect(
        target.struct.computation(
          {
            condition: true,
            if_true: 'a',
            if_false: 'b',
          },
          {} as any,
          {} as any
        )
      ).toEqual({ value: 'a' })
    })
    it('should return result if_false if condition is false', () => {
      expect(
        target.struct.computation(
          {
            condition: false,
            if_true: 'a',
            if_false: 'b',
          },
          {} as any,
          {} as any
        )
      ).toEqual({ value: 'b' })
    })
  })

  describe('getOutputType', () => {
    it('should return the type of the output', () => {
      expect(
        target.struct.getOutputType!(
          target.struct.create({
            inputs: {
              condition: { value: true },
              if_true: { value: undefined },
              if_false: { value: undefined },
            },
          }),
          'value'
        )
      ).toEqual(UNIT_VALUE_TYPES.GENERICS)
      expect(
        target.struct.getOutputType!(
          target.struct.create({
            inputs: {
              condition: { value: true },
              if_true: {
                value: undefined,
                genericsType: UNIT_VALUE_TYPES.SCALER,
              },
              if_false: { value: undefined },
            },
          }),
          'value'
        )
      ).toEqual(UNIT_VALUE_TYPES.SCALER)
      expect(
        target.struct.getOutputType!(
          target.struct.create({
            inputs: {
              condition: { value: true },
              if_true: {
                value: undefined,
              },
              if_false: {
                value: undefined,
                genericsType: UNIT_VALUE_TYPES.SCALER,
              },
            },
          }),
          'value'
        )
      ).toEqual(UNIT_VALUE_TYPES.SCALER)
    })
  })

  describe('cleanGenerics', () => {
    it('should clean generics', () => {
      expect(
        target.struct.cleanGenerics!(
          target.struct.create({
            inputs: {
              condition: { value: true },
              if_true: {
                value: undefined,
                genericsType: UNIT_VALUE_TYPES.SCALER,
              },
              if_false: { value: undefined },
            },
          })
        )
      ).toEqual(
        target.struct.create({
          inputs: {
            condition: { value: true },
            if_true: {
              value: undefined,
              genericsType: UNIT_VALUE_TYPES.SCALER,
            },
            if_false: {
              value: undefined,
              genericsType: UNIT_VALUE_TYPES.SCALER,
            },
          },
        })
      )
    })
  })
})
