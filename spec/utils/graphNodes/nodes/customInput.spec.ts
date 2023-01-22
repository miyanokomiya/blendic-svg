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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { UNIT_VALUE_TYPES } from '/@/utils/graphNodes/core'
import * as target from '/@/utils/graphNodes/nodes/customInput'

describe('src/utils/graphNodes/nodes/customInput.ts', () => {
  describe('computation', () => {
    it('should return output values', () => {
      expect(
        target.struct.computation(
          { input: 'input_val', output: '' },
          target.struct.create({
            data: { default: { value: 0 }, name: '' },
          }),
          {} as any
        )
      ).toEqual({
        input: 'input_val',
        value: 0,
      })
    })
  })
  describe('getOutputType', () => {
    it('should return proper type', () => {
      expect(
        target.struct.getOutputType!(
          target.struct.create({
            data: { default: {}, name: '' },
          }),
          'input'
        )
      ).toEqual(UNIT_VALUE_TYPES.INPUT)
      expect(
        target.struct.getOutputType!(
          target.struct.create({
            data: { default: {}, name: '' },
          }),
          'value'
        )
      ).toEqual(UNIT_VALUE_TYPES.GENERICS)
      expect(
        target.struct.getOutputType!(
          target.struct.create({
            data: {
              default: { genericsType: UNIT_VALUE_TYPES.SCALER },
              name: '',
            },
          }),
          'value'
        )
      ).toEqual(UNIT_VALUE_TYPES.SCALER)
    })
  })
})
