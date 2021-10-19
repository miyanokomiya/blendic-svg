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

import { createStore } from '/@/store/element'
import { useHistoryStore } from '/@/composables/stores/history'
import { getActor, getBElement } from '/@/models'

describe('src/store/element.ts', () => {
  describe('init', () => {
    it('should init state', () => {
      const target = createStore(useHistoryStore())
      const actor = getActor({
        id: 'ac',
        elements: ['el'],
      })
      const element = getBElement({ id: 'el' })
      target.initState([actor], [element], [[actor.id, true]], [])
      expect(target.lastSelectedActor.value).toEqual(actor)
      expect(target.elementMap.value['el']).toEqual(element)
    })
  })

  describe('importActor', () => {
    it('should init state by the actor and select it', () => {
      const target = createStore(useHistoryStore())
      const actor = getActor({
        id: 'ac',
        elements: ['el'],
      })
      const element = getBElement({ id: 'el' })
      target.importActor(actor, [element])
      expect(target.lastSelectedActor.value).toEqual(actor)
      expect(target.elementMap.value['el']).toEqual(element)
    })
  })

  describe('selectActor', () => {
    it('should select the actor and clear element selected state', () => {
      const target = createStore(useHistoryStore())
      target.initState(
        [getActor({ id: 'ac_0', elements: ['e_0'] }), getActor({ id: 'ac_1' })],
        [getBElement({ id: 'e_0' })],
        [],
        []
      )
      target.selectActor('ac_0')
      target.selectElement('e_0')
      expect(target.lastSelectedActor.value?.id).toEqual('ac_0')
      expect(target.selectedElements.value).toEqual({ e_0: true })
      target.selectActor('ac_1')
      expect(target.lastSelectedActor.value?.id).toEqual('ac_1')
      expect(target.selectedElements.value).toEqual({})
    })
  })

  describe('updateArmatureId', () => {
    it('should update armatureId of a selected actor', () => {
      const target = createStore(useHistoryStore())
      target.initState([getActor({ id: 'ac_0' })], [], [], [])
      target.selectActor('ac_0')
      target.updateArmatureId('armature')
      expect(target.lastSelectedActor.value?.armatureId).toBe('armature')
    })
  })

  describe('selectElement', () => {
    it('should select the element', () => {
      const target = createStore(useHistoryStore())
      const elements = [
        getBElement({ id: 'elm_0' }),
        getBElement({ id: 'elm_1' }),
      ]
      target.initState(
        [getActor({ id: 'ac_0', elements: elements.map((e) => e.id) })],
        elements,
        [],
        []
      )
      target.selectActor('ac_0')
      target.selectElement('elm_1')
      expect(target.selectedElements.value).toEqual({ elm_1: true })
    })
  })

  describe('selectAllElement', () => {
    it('should select all elements', () => {
      const target = createStore(useHistoryStore())
      const elements = [
        getBElement({ id: 'elm_0' }),
        getBElement({ id: 'elm_1' }),
      ]
      target.initState(
        [getActor({ id: 'ac_0', elements: elements.map((e) => e.id) })],
        elements,
        [],
        []
      )
      target.selectActor('ac_0')
      target.selectAllElement()
      expect(target.selectedElements.value).toEqual({
        elm_0: true,
        elm_1: true,
      })
      target.selectAllElement()
      expect(target.selectedElements.value).toEqual({})
    })
  })

  describe('updateElement', () => {
    it('should update an selected element', () => {
      const target = createStore(useHistoryStore())
      const elements = [
        getBElement({ id: 'elm_0' }),
        getBElement({ id: 'elm_1' }),
      ]
      target.initState(
        [getActor({ id: 'ac_0', elements: elements.map((e) => e.id) })],
        elements,
        [],
        []
      )
      target.selectActor('ac_0')
      target.selectElement('elm_1')
      target.updateElement({ boneId: 'bone' })
      expect(target.lastSelectedElement.value?.boneId).toBe('bone')
    })
  })
})
