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
  describe('getNotDuplicatedName', () => {
    it.each([
      ['name', [], 'name'],
      ['name', ['name'], 'name.001'],
      ['name', ['name', 'name.001'], 'name.002'],
      ['name.009', ['name.009'], 'name.010'],
      ['name.010', ['name.010'], 'name.011'],
    ])('src: %s, names: %s) => %s', (a, b, expected) => {
      expect(target.getNotDuplicatedName(a, b)).toBe(expected)
    })
  })

  describe('updateNameInList', () => {
    it('should not edit src list', () => {
      const src = [{ name: 'a' }, { name: 'b' }]
      target.updateNameInList(src, 1, 'c')
      expect(src).toEqual([{ name: 'a' }, { name: 'b' }])
    })
    it('should return new list with updated', () => {
      const src = [{ name: 'a' }, { name: 'b' }]
      expect(target.updateNameInList(src, 1, 'c')).toEqual([
        { name: 'a' },
        { name: 'c' },
      ])
    })
    it('should avoid duplicated name', () => {
      const src = [{ name: 'a' }, { name: 'b' }]
      expect(target.updateNameInList(src, 1, 'b')).toEqual([
        { name: 'a' },
        { name: 'b' },
      ])
      expect(target.updateNameInList(src, 1, 'a')).toEqual([
        { name: 'a' },
        { name: 'a.001' },
      ])
    })
    it('should return same list if target is not found', () => {
      const src = [{ name: 'a' }, { name: 'b' }]
      expect(target.updateNameInList(src, 2, 'c')).toEqual(src)
    })
  })

  describe('unshiftInList', () => {
    it('should return new list with the target unshifted', () => {
      const src = [1, 2, 3, 4]
      expect(target.unshiftInList(src, -1)).toEqual([1, 2, 3, 4])
      expect(target.unshiftInList(src, 0)).toEqual([1, 2, 3, 4])
      expect(target.unshiftInList(src, 1)).toEqual([2, 1, 3, 4])
      expect(target.unshiftInList(src, 2)).toEqual([1, 3, 2, 4])
      expect(target.unshiftInList(src, 3)).toEqual([1, 2, 4, 3])
      expect(target.unshiftInList(src, 4)).toEqual([1, 2, 3, 4])
      expect(src).toEqual([1, 2, 3, 4])
    })
  })

  describe('shiftInList', () => {
    it('should return new list with the target shifted', () => {
      const src = [1, 2, 3, 4]
      expect(target.shiftInList(src, -1)).toEqual([1, 2, 3, 4])
      expect(target.shiftInList(src, 0)).toEqual([2, 1, 3, 4])
      expect(target.shiftInList(src, 1)).toEqual([1, 3, 2, 4])
      expect(target.shiftInList(src, 2)).toEqual([1, 2, 4, 3])
      expect(target.shiftInList(src, 3)).toEqual([1, 2, 3, 4])
      expect(target.shiftInList(src, 4)).toEqual([1, 2, 3, 4])
      expect(src).toEqual([1, 2, 3, 4])
    })
  })

  describe('topSort', () => {
    it('should execute topological sort', () => {
      expect(
        target.topSort({
          b: { c: true },
          a: { b: true },
          d: { f: true },
          c: { d: true },
        })
      ).toEqual(['d', 'c', 'b', 'a'])
      expect(
        target.topSort({
          a: { b: true },
          b: { d: true },
          c: { b: true, a: true },
          d: { f: true },
        })
      ).toEqual(['d', 'b', 'a', 'c'])
    })

    it('should ignore circular dependency', () => {
      expect(() =>
        target.topSort({
          a: { b: true },
          b: { c: true },
          c: { a: true },
        })
      ).not.toThrow()
      expect(() => target.topSort({ a: { a: true } })).not.toThrow()
    })

    it('strict: should throw error if circular dependency exists', () => {
      expect(() =>
        target.topSort(
          {
            a: { b: true },
            b: { c: true },
            c: { a: true },
          },
          true
        )
      ).toThrow()
      expect(() => target.topSort({ a: { a: true } }, true)).toThrow()
    })

    it('use case: complex', () => {
      expect(
        target.topSort({
          a: { b: true, f: true },
          b: { c: true, d: true },
          c: { d: true, e: true },
          d: { g: true, f: true },
          e: { f: true },
          f: { g: true },
          g: {},
        })
      ).toEqual(['g', 'f', 'd', 'e', 'c', 'b', 'a'])
    })

    it('use case: should ignore unknown items', () => {
      const src = {
        bNyCW0J6Pyv6P: { bOLndZsV7VK7z: true },
        bOLndZsV7VK7z: { buOg69I8WEF0g: true },
        bbXTCuXiSuHW9: { bd3CTEVcoSwCI: true },
        buOg69I8WEF0g: { bbXTCuXiSuHW9: true },
      } as const
      expect(target.topSort(src)).toEqual([
        'bbXTCuXiSuHW9',
        'buOg69I8WEF0g',
        'bOLndZsV7VK7z',
        'bNyCW0J6Pyv6P',
      ])
    })
  })

  describe('getDependencies', () => {
    it('should return dependency map', () => {
      expect(
        target.getDependencies(
          {
            a: { b: true, f: true },
            b: { c: true, d: true },
            c: { d: true },
            d: { g: true },
          },
          'a'
        )
      ).toEqual(['d', 'c', 'b'])
    })
    it('should ignore circular references', () => {
      expect(
        target
          .getDependencies(
            {
              a: { b: true },
              b: { c: true },
              c: { a: true, d: true },
            },
            'a'
          )
          .sort()
      ).toEqual(['b', 'c'])
    })
  })

  describe('findPath', () => {
    it('should find a path', () => {
      const src = {
        a: { b: true, f: true },
        d: { c: true, f: true },
        f: { b: true },
        b: { c: true },
        c: {},
      } as const

      const result1 = target.findPath(src, 'a', 'c')
      expect(result1.path).toEqual(['a', 'b', 'c'])
      expect(result1.processed.sort()).toEqual(['a', 'b', 'c'])

      const result2 = target.findPath(src, 'd', 'c')
      expect(result2.path).toEqual(['d', 'c'])
      expect(result2.processed).toEqual(['d', 'c'])
    })
    it('should avoid circular dependency', () => {
      const result = target.findPath(
        {
          a: { b: true },
          b: { a: true },
          c: {},
        },
        'a',
        'c'
      )
      expect(result.path).toEqual([])
      expect(result.processed.sort()).toEqual(['a', 'b'])
    })
  })

  describe('getAllDependentTo', () => {
    it('should find a path', () => {
      expect(
        target
          .getAllDependentTo(
            {
              a: { c: true, f: true },
              b: { c: true },
              c: {},
              d: { c: true, f: true },
            },
            'a'
          )
          .sort()
      ).toEqual([])

      expect(
        target
          .getAllDependentTo(
            {
              a: { c: true, f: true },
              b: { c: true },
              c: {},
              d: { c: true, f: true },
            },
            'c'
          )
          .sort()
      ).toEqual(['a', 'b', 'd'])

      expect(
        target
          .getAllDependentTo(
            {
              a: { g: true },
              d: { c: true, f: true },
              f: { b: true },
              b: { c: true },
              c: {},
            },
            'c'
          )
          .sort()
      ).toEqual(['b', 'd', 'f'])
    })
    it('should avoid circular dependency', () => {
      expect(
        target.getAllDependentTo(
          {
            a: { b: true },
            b: { a: true },
            c: {},
          },
          'a'
        )
      ).toEqual(['b'])
    })
  })
})
