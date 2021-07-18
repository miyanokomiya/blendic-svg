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

import {
  EdgeChainGroupItem,
  getGenericsChainAtFn,
  isSameValueType,
  pickNotGenericsType,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

describe('src/utils/graphNodes/index.ts', () => {
  describe('pickNotGenericsType', () => {
    it('should pick some type that is not a generics type', () => {
      expect(
        pickNotGenericsType([
          UNIT_VALUE_TYPES.GENERICS,
          undefined,
          UNIT_VALUE_TYPES.SCALER,
          UNIT_VALUE_TYPES.GENERICS,
        ])
      ).toEqual(UNIT_VALUE_TYPES.SCALER)
    })
    it('should return undefined if all types are generics types or undefined', () => {
      expect(
        pickNotGenericsType([
          UNIT_VALUE_TYPES.GENERICS,
          undefined,
          UNIT_VALUE_TYPES.GENERICS,
        ])
      ).toBe(undefined)
    })
  })

  describe('isSameValueType', () => {
    it('should return true if two types are the same', () => {
      expect(
        isSameValueType(UNIT_VALUE_TYPES.SCALER, UNIT_VALUE_TYPES.SCALER)
      ).toBe(true)
      expect(
        isSameValueType(UNIT_VALUE_TYPES.GENERICS, UNIT_VALUE_TYPES.GENERICS)
      ).toBe(true)
    })
    it('should return true if two types are the same', () => {
      expect(
        isSameValueType(UNIT_VALUE_TYPES.SCALER, UNIT_VALUE_TYPES.VECTOR2)
      ).toBe(false)
      expect(
        isSameValueType(UNIT_VALUE_TYPES.TEXT, UNIT_VALUE_TYPES.OBJECT)
      ).toBe(false)
      expect(
        isSameValueType(UNIT_VALUE_TYPES.BOOLEAN, UNIT_VALUE_TYPES.SCALER)
      ).toBe(false)
    })
    it('should return true if two types are undefined', () => {
      expect(isSameValueType(undefined, undefined)).toBe(true)
      expect(isSameValueType(undefined, UNIT_VALUE_TYPES.GENERICS)).toBe(false)
    })
  })

  describe('getGenericsChainAtFn', () => {
    it('should return a function to get generics chain', () => {
      const chains: EdgeChainGroupItem[][] = [
        [
          { id: 'id', key: 'a' },
          { id: 'id', key: 'b' },
          { id: 'id', key: 'value', output: true },
        ],
      ]
      expect(getGenericsChainAtFn(chains)('a')).toEqual(chains[0])
      expect(getGenericsChainAtFn(chains)('value', true)).toEqual(chains[0])
      expect(getGenericsChainAtFn(chains)('c')).toEqual([])
    })
  })
})
