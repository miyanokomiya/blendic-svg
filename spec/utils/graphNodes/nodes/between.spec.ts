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

import * as target from '/@/utils/graphNodes/nodes/between'

describe('src/utils/graphNodes/nodes/between.ts', () => {
  describe('computation', () => {
    it('should return result of from <= from <= to', () => {
      expect(
        target.struct.computation(
          { number: -0.1, from: 0, to: 1 },
          {} as any,
          {} as any
        )
      ).toEqual({ value: false })
      expect(
        target.struct.computation(
          { number: 0, from: 0, to: 1 },
          {} as any,
          {} as any
        )
      ).toEqual({ value: true })
      expect(
        target.struct.computation(
          { number: 1, from: 0, to: 1 },
          {} as any,
          {} as any
        )
      ).toEqual({ value: true })
      expect(
        target.struct.computation(
          { number: 1.1, from: 0, to: 1 },
          {} as any,
          {} as any
        )
      ).toEqual({ value: false })
    })
  })
})
