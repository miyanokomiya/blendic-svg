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

import { ref } from 'vue'
import { makeAccessors, makeRefAccessors } from '/@/composables/commons'

describe('src/composables/commons.ts', () => {
  describe('makeAccessors', () => {
    it('should return a object having getter and setter', () => {
      const target = { value: 0 }
      const ret = makeAccessors(target)
      expect(ret.get()).toBe(0)
      ret.set(10)
      expect(ret.get()).toBe(10)
    })
  })

  describe('makeRefAccessors', () => {
    it('should return a object having getter and setter for Ref', () => {
      const target = ref(0)
      const ret = makeRefAccessors(target)
      expect(ret.get()).toBe(0)
      ret.set(10)
      expect(ret.get()).toBe(10)
    })
  })
})
