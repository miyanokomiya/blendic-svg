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

import { getTransform } from '/@/models'
import {
  cloneListFn,
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
    describe('should return a function', () => {
      it('to get generics chain', () => {
        const chains: EdgeChainGroupItem[][] = [
          [
            { id: 'id', key: 'a' },
            { id: 'id', key: 'value', output: true },
          ],
        ]
        expect(getGenericsChainAtFn('id', chains)('a')).toEqual(chains[0])
        expect(getGenericsChainAtFn('id', chains)('value', true)).toEqual(
          chains[0]
        )
      })
      it('to get undefined if any generics chains are not found', () => {
        const chains: EdgeChainGroupItem[][] = [[]]
        expect(getGenericsChainAtFn('id', chains)('c')).toBe(undefined)
      })
    })
  })

  describe('cloneListFn', () => {
    function getContext() {
      return {
        getTransform: jest.fn().mockReturnValue(getTransform({ rotate: 1 })),
        setTransform: jest.fn(),
        createCloneGroupObject: jest.fn().mockReturnValue('b'),
        cloneObject: jest.fn().mockImplementation((_a, _b, id: string) => {
          return id
        }),
      }
    }

    it('should return a function to clone list items', () => {
      const context = getContext()
      const fn = cloneListFn(context as any, 'a', 'group')

      fn([getTransform({ rotate: 10 }), getTransform({ rotate: 20 })])
      expect(context.cloneObject).toHaveBeenNthCalledWith(
        1,
        'a',
        { parent: 'group' },
        'group_0'
      )
      expect(context.setTransform).toHaveBeenNthCalledWith(
        1,
        'group_0',
        getTransform({ rotate: 11 })
      )
      expect(context.cloneObject).toHaveBeenNthCalledWith(
        2,
        'a',
        { parent: 'group' },
        'group_1'
      )
      expect(context.setTransform).toHaveBeenNthCalledWith(
        2,
        'group_1',
        getTransform({ rotate: 21 })
      )
    })
    it('should make rotate the same value as that of the src object if fix_rotate is true', () => {
      const context = getContext()
      const fn = cloneListFn(context as any, 'a', 'group', true)

      fn([getTransform({ rotate: 10 })])
      expect(context.setTransform).toHaveBeenNthCalledWith(
        1,
        'group_0',
        getTransform({ rotate: 1 })
      )
    })
  })
})
