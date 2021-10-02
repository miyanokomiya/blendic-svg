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
  getOriginPartial,
  isBoneSelected,
  isSameBoneSelectedState,
  mergeMap,
  toMap,
} from '/@/models'

describe('models/index.ts', () => {
  describe('toMap', () => {
    it('returns id map', () => {
      expect(
        toMap([
          { id: '1', props: 'a' },
          { id: '2', props: 'b' },
        ])
      ).toEqual({
        1: { id: '1', props: 'a' },
        2: { id: '2', props: 'b' },
      })
    })
  })

  describe('mergeMap', () => {
    it('merge map', () => {
      expect(
        mergeMap<any>(
          { a: { aa: 1 }, b: { ba: 10, bb: 20 } },
          { b: { bb: 21 } }
        )
      ).toEqual({ a: { aa: 1 }, b: { ba: 10, bb: 21 } })
    })
    it('override nested props', () => {
      expect(
        mergeMap<any>(
          { a: { aa: { aaa: 1, aab: 2 } } },
          { a: { aa: { aab: 20 } } }
        )
      ).toEqual({ a: { aa: { aab: 20 } } })
    })
  })

  describe('getOriginPartial', () => {
    it('get origin partial', () => {
      expect(getOriginPartial({ a: 1, b: 2 }, { b: 4 })).toEqual({ b: 2 })
    })
  })

  describe('isSameBoneSelectedState', () => {
    it.each([
      [{ head: true }, { head: true }, true],
      [{ head: true }, { head: true, tail: true }, false],
      [{ tail: true }, { tail: true }, true],
      [{}, {}, true],
    ] as const)('add(%s, %s) => %s', (a, b, expected) => {
      expect(isSameBoneSelectedState(a, b)).toBe(expected)
    })
  })

  describe('isBoneSelected', () => {
    describe('partial', () => {
      it.each([
        [{}, false],
        [{ head: true }, true],
        [{ tail: true }, true],
        [{ head: true, tail: true }, true],
      ] as const)('add(%s, %s) => %s', (a, expected) => {
        expect(isBoneSelected(a)).toBe(expected)
      })
    })
    describe('all', () => {
      it.each([
        [{}, false],
        [{ head: true }, false],
        [{ tail: true }, false],
        [{ head: true, tail: true }, true],
      ] as const)('add(%s, %s) => %s', (a, expected) => {
        expect(isBoneSelected(a, true)).toBe(expected)
      })
    })
  })
})
