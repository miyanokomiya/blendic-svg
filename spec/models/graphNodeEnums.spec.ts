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

import { getGraphValueEnumKey } from '/@/models/graphNodeEnums'

describe('src/models/graphNodeEnums.ts', () => {
  describe('getGraphValueEnumKey', () => {
    it('should return a key of the enum', () => {
      expect(getGraphValueEnumKey('SPREAD_METHOD', 0)).toBe('pad')
      expect(getGraphValueEnumKey('SPREAD_METHOD', 1)).toBe('reflect')
      expect(getGraphValueEnumKey('SPREAD_METHOD', 2)).toBe('repeat')
    })
    it('should clamp and floor the value', () => {
      expect(getGraphValueEnumKey('SPREAD_METHOD', -0.1)).toBe('pad')
      expect(getGraphValueEnumKey('SPREAD_METHOD', 1.1)).toBe('reflect')
      expect(getGraphValueEnumKey('SPREAD_METHOD', 2.1)).toBe('repeat')
    })
    it('should recognize CLIP_PATH_UNITS_KEY', () => {
      expect(getGraphValueEnumKey('SPACE_UNITS', 0.1)).toBe('userSpaceOnUse')
      expect(getGraphValueEnumKey('SPACE_UNITS', 1.1)).toBe('objectBoundingBox')
    })
  })
})
