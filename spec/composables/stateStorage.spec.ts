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

import { useResizableStorage } from '/@/composables/stateStorage'

describe('src/composables/stateStorage.ts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('useResizableStorage', () => {
    it('should have initialRate if a key is empty', () => {
      const ret = useResizableStorage('', 0.3)
      expect(ret.restoredRate).toBe(0.3)
    })
    it('should save to and restore from localStorage', () => {
      const ret = useResizableStorage('test', 0.3)
      ret.setDirty(true)
      ret.save(0.5)
      expect(useResizableStorage('test', 0.3).restoredRate).toBe(0.5)
    })
    it('should not save if dirty is not set true', () => {
      const ret = useResizableStorage('test', 0.3)
      ret.save(0.5)
      expect(useResizableStorage('test', 0.3).restoredRate).toBe(0.3)
      ret.setDirty(true)
      ret.save(0.5)
      ret.save(0.8)
      expect(useResizableStorage('test', 0.3).restoredRate).toBe(0.5)
    })
  })
})
