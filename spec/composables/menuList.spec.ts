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

import { useMenuList } from '/@/composables/menuList'

describe('src/composables/menuList.ts', () => {
  describe('useMenuList', () => {
    it('should return a menu list', () => {
      const srcList = [
        { label: 'a', exec: jest.fn() },
        { label: 'b', exec: jest.fn() },
        { label: 'c', exec: jest.fn() },
      ]
      const ret = useMenuList(() => srcList)
      expect(ret.list.value.map((item) => item.label)).toEqual(['a', 'b', 'c'])
    })
    it('should save last selected item', () => {
      const srcList = [
        { label: 'a', exec: jest.fn() },
        { label: 'b', exec: jest.fn() },
        { label: 'c', exec: jest.fn() },
      ]
      const ret = useMenuList(() => srcList)
      ret.list.value[1].exec()
      expect(srcList[1].exec).toHaveReturnedTimes(1)
      expect(ret.list.value[1].focus).toBe(true)
    })
  })
})
