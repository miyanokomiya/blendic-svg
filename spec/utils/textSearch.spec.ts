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

import * as target from '/@/utils/textSearch'

describe('src/utils/textSearch.ts', () => {
  describe('splitByKeyword', () => {
    it('should return splitted text', () => {
      expect(target.splitByKeyword('cd', 'abcdefg abcdefg')).toEqual([
        { text: 'ab' },
        { text: 'cd', hit: true },
        { text: 'efg ab' },
        { text: 'cd', hit: true },
        { text: 'efg' },
      ])
      expect(target.splitByKeyword('cdg', 'abcdefg abcdefg')).toEqual([
        { text: 'abcdefg abcdefg' },
      ])
      expect(target.splitByKeyword('b', 'abcdefg abcdefg')).toEqual([
        { text: 'a' },
        { text: 'b', hit: true },
        { text: 'cdefg a' },
        { text: 'b', hit: true },
        { text: 'cdefg' },
      ])
    })

    it('should be case insensitive', () => {
      expect(target.splitByKeyword('Cd', 'abcDefg abcdefg')).toEqual([
        { text: 'ab' },
        { text: 'cD', hit: true },
        { text: 'efg ab' },
        { text: 'cd', hit: true },
        { text: 'efg' },
      ])
    })
  })
})
