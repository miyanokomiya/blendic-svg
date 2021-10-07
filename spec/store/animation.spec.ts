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

import { getAction } from '/@/models'
import { getKeyframeBone } from '/@/models/keyframe'
import * as indexStore from '/@/store'
import { createStore } from '/@/store/animation'
import { useHistoryStore } from '/@/store/history'

describe('src/store/animation.ts', () => {
  function prepare() {
    const historyStore = useHistoryStore()
    const store = indexStore.createStore(useHistoryStore())
    store.createDefaultEntities()
    const target = createStore(historyStore, store)

    return { target, store }
  }

  describe('initState', () => {
    it('should init state', () => {
      const { target } = prepare()
      const action = getAction({
        id: 'ac',
        keyframes: ['k_0'],
      })
      const keyframe = getKeyframeBone({ id: 'k_0' })
      target.initState([action], [keyframe])
      expect(target.actions.value.map((a) => a.id)).toEqual(['ac'])
      expect(target.keyframes.value.map((k) => k.id)).toEqual([])
      target.selectAction('ac')
      expect(target.keyframes.value.map((k) => k.id)).toEqual(['k_0'])
    })
  })

  describe('addAction', () => {
    it('should add new action having a ref to current armature', () => {
      const { target, store } = prepare()
      target.addAction()
      expect(target.selectedAction.value?.armatureId).toBe(
        store.lastSelectedArmatureId.value
      )
      expect(target.actions.value).toHaveLength(1)
      target.addAction()
      expect(target.actions.value).toHaveLength(2)
    })
  })
})
