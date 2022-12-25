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

import {
  clearClosedState,
  injectTreeContext,
  provideTreeContext,
} from '/@/composables/treeContext'

describe('src/composables/treeContext.ts', () => {
  beforeEach(() => {
    clearClosedState()
  })

  describe('provideTreeContext', () => {
    function prepare() {
      const provided: { [key: string]: any } = {}
      const provide = (key: string, value: any) => (provided[key] = value)
      return { provide, provided }
    }

    describe('setClosed', () => {
      it('should set new value', () => {
        const { provide, provided } = prepare()
        provideTreeContext('test', { provide })
        expect(provided.getClosedMap()).toEqual({})
        provided.setClosed('a', true)
        expect(provided.getClosedMap()).toEqual({ a: true })
        provided.setClosed('b', true)
        expect(provided.getClosedMap()).toEqual({ a: true, b: true })
        provided.setClosed('a', false)
        expect(provided.getClosedMap()).toEqual({ b: true })
      })

      it('should share the state among the key', () => {
        const p1 = prepare()
        const p2 = prepare()
        const p3 = prepare()
        provideTreeContext('same', { provide: p1.provide })
        p1.provided.setClosed('a', true)
        provideTreeContext('same', { provide: p2.provide })
        provideTreeContext('different', { provide: p3.provide })
        expect(p1.provided.getClosedMap()).toEqual({ a: true })
        expect(p2.provided.getClosedMap()).toEqual({ a: true })
        expect(p3.provided.getClosedMap()).toEqual({})
      })
    })
  })

  describe('injectTreeContext', () => {
    function prepare() {
      const injected: { [key: string]: any } = {}
      const inject: any = (key: string, value: any) => (injected[key] = value)
      return { inject, injected }
    }

    it('should inject the context', () => {
      const { inject, injected } = prepare()
      injectTreeContext(inject)
      expect(Object.keys(injected).length).toBe(6)
      expect(injected).toHaveProperty('getSelectedMap')
      expect(injected).toHaveProperty('getEditable')
      expect(injected).toHaveProperty('updateName')
      expect(injected).toHaveProperty('onClickElement')
      expect(injected).toHaveProperty('getClosedMap')
      expect(injected).toHaveProperty('setClosed')
    })
  })
})
