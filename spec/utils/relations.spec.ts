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

import * as target from '../../src/utils/relations'

describe('utils/relations', () => {
  describe('getNextName', () => {
    it.each([
      ['name', [], 'name.001'],
      ['name.001', [], 'name.002'],
      ['name.009', [], 'name.010'],
      ['name.010', [], 'name.011'],
      ['name.999', [], 'name.1000'],
      ['name.1000', [], 'name.1001'],
    ])('src: %s, names: %s) => %s', (a, b, expected) => {
      expect(target.getNextName(a, b)).toBe(expected)
    })
    it.each([
      ['name', ['name.001'], 'name.002'],
      ['name.001', ['name.002', 'name.003'], 'name.004'],
    ])('src: %s, names: %s) => %s', (a, b, expected) => {
      expect(target.getNextName(a, b)).toBe(expected)
    })
  })
})
