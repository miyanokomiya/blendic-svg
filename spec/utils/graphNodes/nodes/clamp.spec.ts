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

import * as target from '/@/utils/graphNodes/nodes/clamp'

describe('src/utils/graphNodes/nodes/clamp.ts', () => {
  describe('computation', () => {
    it('should return clamped value', () => {
      expect(
        target.struct.computation(
          { number: -1, from: 2, to: 3, loop: false },
          {} as any,
          {} as any
        )
      ).toEqual({ value: 2 })
      expect(
        target.struct.computation(
          { number: 2.5, from: 2, to: 3, loop: false },
          {} as any,
          {} as any
        )
      ).toEqual({ value: 2.5 })
      expect(
        target.struct.computation(
          { number: 3.5, from: 2, to: 3, loop: false },
          {} as any,
          {} as any
        )
      ).toEqual({ value: 3 })
    })
    it('should return looped clamped value if loop is true', () => {
      expect(
        target.struct.computation(
          { number: -1, from: 0, to: 10, loop: true },
          {} as any,
          {} as any
        )
      ).toEqual({ value: 9 })
      expect(
        target.struct.computation(
          { number: 21, from: 0, to: 10, loop: true },
          {} as any,
          {} as any
        )
      ).toEqual({ value: 1 })
      expect(
        target.struct.computation(
          { number: -11, from: -10, to: 0, loop: true },
          {} as any,
          {} as any
        )
      ).toEqual({ value: -1 })
    })
  })
})
