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

import { createStore } from '/@/store/canvas'
import { createStore as createIndexStore } from '/@/store'
import { createStore as createElementStore } from '/@/store/element'
import { createStore as createAnimationStore } from '/@/store/animation'
import { useHistoryStore } from '/@/composables/stores/history'

describe('store/canvas.ts', () => {
  function prepare() {
    const historyStore = useHistoryStore()
    const indexStore = createIndexStore(historyStore)
    const target = createStore(
      historyStore,
      indexStore,
      createElementStore(historyStore),
      createAnimationStore(historyStore, indexStore)
    )

    return {
      historyStore,
      indexStore,
      target,
    }
  }
  describe('isOppositeSide', () => {
    it('returns false if same side', () => {
      const { target } = prepare()

      expect(
        target.isOppositeSide({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 })
      ).toBe(false)
      expect(
        target.isOppositeSide({ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 })
      ).toBe(false)
      expect(
        target.isOppositeSide({ x: 0, y: 0 }, { x: -1, y: -1 }, { x: -1, y: 0 })
      ).toBe(false)
    })
    it('returns true if opposite side', () => {
      const { target } = prepare()

      expect(
        target.isOppositeSide({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 1 })
      ).toBe(true)
      expect(
        target.isOppositeSide({ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 1 })
      ).toBe(true)
      expect(
        target.isOppositeSide({ x: 0, y: 0 }, { x: -1, y: -1 }, { x: 1, y: 0 })
      ).toBe(true)
    })
  })
})
