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
  dropListByKey,
  dropMap,
  dropMapIfFalse,
  extractMap,
  flatKeyListMap,
  getParentIdPath,
  getUnduplicatedNameMap,
  hasLeftRightName,
  mapReduce,
  mergeListByKey,
  regenerateIdMap,
  sortByValue,
  sumMap,
  sumReduce,
  symmetrizeName,
  toKeyListMap,
  toKeyMap,
  toList,
} from '/@/utils/commons'

describe('utils/commons.ts', () => {
  describe('toKeyMap', () => {
    it('list to map', () => {
      expect(
        toKeyMap(
          [
            { a: 1, b: 20 },
            { a: 2, b: 21 },
          ],
          'a'
        )
      ).toEqual({
        1: { a: 1, b: 20 },
        2: { a: 2, b: 21 },
      })
    })
  })

  describe('toKeyListMap', () => {
    it('list to list map having the same key value', () => {
      expect(
        toKeyListMap(
          [
            { a: 1, b: 20 },
            { a: 2, b: 21 },
            { a: 2, b: 22 },
            { a: 3, b: 23 },
          ],
          'a'
        )
      ).toEqual({
        1: [{ a: 1, b: 20 }],
        2: [
          { a: 2, b: 21 },
          { a: 2, b: 22 },
        ],
        3: [{ a: 3, b: 23 }],
      })
    })
  })

  describe('flatKeyListMap', () => {
    it('flat key list map', () => {
      expect(
        flatKeyListMap({
          1: [{ a: 1, b: 20 }],
          2: [
            { a: 2, b: 21 },
            { a: 2, b: 22 },
          ],
          3: [{ a: 3, b: 23 }],
        })
      ).toEqual([
        { a: 1, b: 20 },
        { a: 2, b: 21 },
        { a: 2, b: 22 },
        { a: 3, b: 23 },
      ])
    })
  })

  describe('toList', () => {
    it('map to list', () => {
      expect(
        toList({
          1: { a: 1, b: 20 },
          2: { a: 2, b: 21 },
        })
      ).toEqual([
        { a: 1, b: 20 },
        { a: 2, b: 21 },
      ])
    })
  })

  describe('mapReduce', () => {
    it('map operation for object', () => {
      expect(
        mapReduce(
          {
            id_a: {
              a: 1,
              b: 2,
            },
            id_b: {
              a: 4,
              b: 8,
            },
          },
          (obj: { a: number; b: number }) => ({ a: obj.b, b: obj.a })
        )
      ).toEqual({
        id_a: {
          a: 2,
          b: 1,
        },
        id_b: {
          a: 8,
          b: 4,
        },
      })
    })
  })

  describe('extractMap', () => {
    it('extract origin by keys', () => {
      expect(
        extractMap(
          {
            1: { a: 1 },
            2: { a: 2 },
            3: { a: 3 },
            4: { a: 4 },
          },
          { 2: true, 3: false, 5: true }
        )
      ).toEqual({
        2: { a: 2 },
        3: { a: 3 },
      })
    })
  })

  describe('dropMap', () => {
    it('drop origin by keys', () => {
      expect(
        dropMap(
          {
            1: { a: 1 },
            2: { a: 2 },
            3: { a: 3 },
            4: { a: 4 },
          },
          { 2: true, 3: false, 5: true }
        )
      ).toEqual({
        1: { a: 1 },
        4: { a: 4 },
      })
    })
  })

  describe('dropMapIfFalse', () => {
    it('drop origin if returns false', () => {
      expect(
        dropMapIfFalse(
          {
            1: { a: 1 },
            2: { a: 2 },
            3: { a: 3 },
            4: { a: 4 },
          },
          (val) => val.a % 2 === 0
        )
      ).toEqual({
        2: { a: 2 },
        4: { a: 4 },
      })
    })
  })

  describe('mergeListByKey', () => {
    it('merge two list by the key', () => {
      expect(
        mergeListByKey(
          [
            { a: 1, val: 'src_1' },
            { a: 2, val: 'src_2' },
            { a: 3, val: 'src_3' },
          ],
          [
            { a: 1, val: 'ove_1' },
            { a: 3, val: 'ove_3' },
            { a: 4, val: 'ove_4' },
          ],
          'a'
        )
      ).toEqual([
        { a: 1, val: 'ove_1' },
        { a: 2, val: 'src_2' },
        { a: 3, val: 'ove_3' },
        { a: 4, val: 'ove_4' },
      ])
    })
  })

  describe('dropListByKey', () => {
    it('drop items by the key value', () => {
      expect(
        dropListByKey(
          [
            { a: 1, val: 'src_1' },
            { a: 2, val: 'src_2' },
          ],
          [
            { a: 1, val: 'ove_1' },
            { a: 3, val: 'ove_3' },
          ],
          'a'
        )
      ).toEqual([{ a: 2, val: 'src_2' }])
    })
    it('inverse: true => get dropped items by the key value', () => {
      expect(
        dropListByKey(
          [
            { a: 1, val: 'src_1' },
            { a: 2, val: 'src_2' },
          ],
          [
            { a: 1, val: 'ove_1' },
            { a: 3, val: 'ove_3' },
          ],
          'a',
          true
        )
      ).toEqual([{ a: 1, val: 'src_1' }])
    })
  })

  describe('getParentIdPath', () => {
    it('get id list of the root to the parent', () => {
      expect(
        getParentIdPath(
          {
            '1': { id: '1', parentId: '' },
            '2': { id: '2', parentId: '' },
            '1_1': { id: '1_1', parentId: '1' },
            '1_1_1': { id: '1_1_1', parentId: '1_1' },
          },
          '1_1_1'
        )
      ).toEqual(['1', '1_1'])
    })
    it('stop if the parent does not exist', () => {
      expect(
        getParentIdPath(
          {
            '1': { id: '1', parentId: '' },
            '2': { id: '2', parentId: '' },
            '1_1': { id: '1_1', parentId: '-1' },
            '1_1_1': { id: '1_1_1', parentId: '1_1' },
          },
          '1_1_1'
        )
      ).toEqual(['1_1'])
    })
    it('stop at the preventId', () => {
      expect(
        getParentIdPath(
          {
            '1': { id: '1', parentId: '' },
            '2': { id: '2', parentId: '' },
            '1_1': { id: '1_1', parentId: '1' },
            '1_1_1': { id: '1_1_1', parentId: '1_1' },
            '1_1_1_1': { id: '1_1_1_1', parentId: '1_1_1' },
          },
          '1_1_1_1',
          '1_1'
        )
      ).toEqual(['1_1_1'])
    })
  })

  describe('hasLeftRightName', () => {
    it.each([
      ['a', ''],
      ['a.r', 'r'],
      ['a.R', 'R'],
      ['a.l', 'l'],
      ['a.L', 'L'],
      ['a.r.001', 'r'],
      ['r.001', ''],
    ])('%s has %s', (a, expected) => {
      expect(hasLeftRightName(a)).toBe(expected)
    })
  })

  describe('symmetrizeName', () => {
    it.each([
      ['a', 'a'],
      ['a.r', 'a.l'],
      ['a.R', 'a.L'],
      ['a.l', 'a.r'],
      ['a.L', 'a.R'],
      ['a.r.001', 'a.l.001'],
      ['r.001', 'r.001'],
    ])('%s -> %s', (a, expected) => {
      expect(symmetrizeName(a)).toBe(expected)
    })
  })

  describe('getUnduplicatedNameMap', () => {
    it('get unduplicated name map', () => {
      expect(
        getUnduplicatedNameMap(['a', 'b', 'c', 'c.001'], ['b', 'c', 'd'])
      ).toEqual({
        b: 'b.001',
        c: 'c.002',
        d: 'd',
      })
    })
  })

  describe('sortByValue', () => {
    it('sorte by name', () => {
      const src = [
        { id: 'a', name: 'dd' },
        { id: 'b', name: 'bb' },
        { id: 'c', name: 'cc' },
        { id: 'd', name: 'aa' },
      ]
      expect(sortByValue(src, 'name')).toEqual([
        { id: 'd', name: 'aa' },
        { id: 'b', name: 'bb' },
        { id: 'c', name: 'cc' },
        { id: 'a', name: 'dd' },
      ])
      // not override src array
      expect(src).toEqual([
        { id: 'a', name: 'dd' },
        { id: 'b', name: 'bb' },
        { id: 'c', name: 'cc' },
        { id: 'd', name: 'aa' },
      ])
    })
  })

  describe('sumReduce', () => {
    it('sum values of maps', () => {
      expect(
        sumReduce([
          { a: 1, b: 2, d: 3 },
          { b: 20, c: 21 },
        ])
      ).toEqual({
        a: 1,
        b: 22,
        c: 21,
        d: 3,
      })
    })
  })

  describe('sumMap', () => {
    it('sum values of two maps', () => {
      expect(sumMap({ a: 1, b: 2, d: 3 }, { b: 20, c: 21 })).toEqual({
        a: 1,
        b: 22,
        c: 21,
        d: 3,
      })
    })
  })

  describe('regenerateIdMap', () => {
    it('renerate all ids and make new map', () => {
      const ret = regenerateIdMap({
        a: { id: 'a', value: 1 },
      })
      const keys = Object.keys(ret)
      expect(keys).toHaveLength(1)
      expect(ret[keys[0]]).toEqual({ id: keys[0], value: 1 })
    })
  })
})
