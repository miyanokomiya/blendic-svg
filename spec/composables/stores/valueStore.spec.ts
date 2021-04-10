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

import { useValueStore } from '/@/composables/stores/valueStore'

describe('src/composables/stores/valueStore.ts', () => {
  describe('setState', () => {
    it('should return history item to set', () => {
      const store = useValueStore('test', () => 0)
      expect(store.state.value).toBe(0)
      const item = store.setState(10)
      expect(store.state.value).toBe(0)
      item!.redo()
      expect(store.state.value).toBe(10)
      item!.undo()
      expect(store.state.value).toBe(0)
    })
    it('should return undefined if it is not need to update', () => {
      const store = useValueStore(
        'test',
        () => 1,
        (a, b) => a === b / 10
      )
      expect(store.setState(10)).toBe(undefined)
      expect(store.setState(11)).not.toBe(undefined)
    })
  })
})
