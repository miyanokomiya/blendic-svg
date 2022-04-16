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

import { isCopyPasteKeyevent } from '/@/utils/devices'

describe('src/utils/devices.ts', () => {
  describe('isCopyPasteKeyevent', () => {
    it('should return true if the option means copy or paste', () => {
      expect(isCopyPasteKeyevent({ ctrl: false, key: 'v' })).toBe(false)
      expect(isCopyPasteKeyevent({ ctrl: false, key: 'c' })).toBe(false)
      expect(isCopyPasteKeyevent({ ctrl: true, key: 'V', shift: true })).toBe(
        false
      )
      expect(isCopyPasteKeyevent({ ctrl: true, key: 'C', shift: true })).toBe(
        false
      )
      expect(isCopyPasteKeyevent({ ctrl: true, key: 'a' })).toBe(false)

      expect(isCopyPasteKeyevent({ ctrl: true, key: 'v' })).toBe(true)
      expect(isCopyPasteKeyevent({ ctrl: true, key: 'c' })).toBe(true)
    })
  })
})
