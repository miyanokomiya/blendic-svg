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

import { ref, nextTick } from 'vue'
import { useBooleanMap } from '/@/composables/idMap'

describe('src/composables/idMap.ts', () => {
  describe('useBooleanMap', () => {
    it('should toggle state', () => {
      const ret = useBooleanMap(() => ['a', 'b', 'c'])

      expect(ret.booleanMap.value).toEqual({})
      ret.toggle('a')
      expect(ret.booleanMap.value).toEqual({ a: true })
      ret.toggle('a')
      expect(ret.booleanMap.value).toEqual({})
    })
    it('should drop ids if its removed from src', async () => {
      const ids = ref(['a', 'b', 'c'])
      const { booleanMap, toggle } = useBooleanMap(() => ids.value)

      expect(booleanMap.value).toEqual({})
      toggle('a')
      toggle('b')
      toggle('c')
      expect(booleanMap.value).toEqual({ a: true, b: true, c: true })
      ids.value = ['a', 'c']
      await nextTick()
      expect(booleanMap.value).toEqual({ a: true, c: true })
    })
  })
})
