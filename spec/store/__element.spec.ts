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

import { createStore } from '/@/store/__element'
import { useHistoryStore } from '/@/composables/stores/history'
import { getActor, getBElement } from '/@/models'

describe('src/store/element.ts', () => {
  describe('init', () => {
    it('should init state and select an actor', () => {
      const target = createStore(useHistoryStore())
      const actor = getActor({
        id: 'ac',
        e_lements: ['el'],
      })
      const element = getBElement({ id: 'el' })
      target.initState([actor], [element])
      expect(target.lastSelectedActor.value).toEqual(actor)
      expect(target.elementMap.value['el']).toEqual(element)
    })
  })

  describe('importActor', () => {
    it('should init state by the actor and select it', () => {
      const target = createStore(useHistoryStore())
      const actor = getActor({
        id: 'ac',
        e_lements: ['el'],
      })
      const element = getBElement({ id: 'el' })
      target.importActor(actor, [element])
      expect(target.lastSelectedActor.value).toEqual(actor)
      expect(target.elementMap.value['el']).toEqual(element)
    })
  })

  describe('selectActor', () => {
    it('should select the actor', () => {
      const target = createStore(useHistoryStore())
      const actor = getActor({ id: 'ac' })
      target.importActor(actor, [])
      target.initState([getActor({ id: 'ac_0' }), getActor({ id: 'ac_1' })], [])
      target.selectActor('ac_0')
      expect(target.lastSelectedActor.value?.id).toEqual('ac_0')
      target.selectActor('ac_1')
      expect(target.lastSelectedActor.value?.id).toEqual('ac_1')
    })
  })
})
