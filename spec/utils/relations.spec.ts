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

  describe('getAllDependencies', () => {
    it('should return dependency map', () => {
      expect(
        target.getAllDependencies(
          {
            a: { b: true, f: true },
            b: { c: true, d: true },
            d: { g: true },
          },
          'a'
        )
      ).toEqual({
        b: true,
        f: true,
        c: true,
        d: true,
        g: true,
      })
    })
    it('should ignore circular references', () => {
      expect(
        target.getAllDependencies(
          {
            a: { b: true },
            b: { c: true },
            c: { a: true, d: true },
          },
          'a'
        )
      ).toEqual({ b: true, c: true, d: true })
    })
  })
})
