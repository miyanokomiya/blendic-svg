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
  mapFilter,
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
  pickAnyItem,
  mapFilterExec,
  hasSameProps,
  shiftMergeProps,
  mergeOrDropMap,
  uniq,
  resetId,
  getFirstProp,
  splitList,
  getTreeIdPath,
  reduceToMap,
  shallowEqual,
  xor,
  getEntries,
  thinOutSameItems,
  thinOutSameAttributes,
  isNotNullish,
  dropNullishItem,
  thinOutList,
  toMapFromString,
} from '/@/utils/commons'

describe('utils/commons.ts', () => {
  describe('toMapFromString', () => {
    it('should return key map with initial values', () => {
      expect(toMapFromString(['a', 'b'], true)).toEqual({ a: true, b: true })
    })
  })

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

  describe('mapFilter', () => {
    it('drop origin if returns false', () => {
      expect(
        mapFilter(
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

  describe('getTreeIdPath', () => {
    it('should return id path: a ~ b', () => {
      const map = {
        a: { id: 'a', parentId: '' },
        b: { id: 'b', parentId: 'a' },
        c: { id: 'c', parentId: 'b' },
        d: { id: 'd', parentId: 'c' },
        e: { id: 'e', parentId: 'd' },
      }
      expect(getTreeIdPath(map, 'b', 'd')).toEqual(['b', 'c', 'd'])
      expect(getTreeIdPath(map, 'd', 'b')).toEqual(['b', 'c', 'd'])
      expect(getTreeIdPath(map, 'b', 'c')).toEqual(['b', 'c'])
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

  describe('pickAnyItem', () => {
    it('should return undefined if map has no item', () => {
      expect(pickAnyItem({})).toBe(undefined)
    })
    it('should pick any item in map', () => {
      const map = { a: 1, b: 1 }
      expect(pickAnyItem(map)).toBe(1)
    })
  })

  describe('mapFilterExec', () => {
    it('should exec a operation only to targets', () => {
      const srcMap = { a: 1, b: 2, c: 3, d: 4 }
      const targetMap = { a: 1, b: 2, c: 3 }
      const ret = mapFilterExec(srcMap, targetMap, (map) => {
        return {
          a: map.a * 2,
          b: map.b * 3,
        }
      })
      expect(ret).toEqual({ a: 2, b: 6, d: 4 })
    })
  })

  describe('hasSameProps', () => {
    it('should return true if all props are same', () => {
      expect(hasSameProps({}, {})).toBe(true)
      expect(hasSameProps({ a: 1 }, { a: 1 })).toBe(true)
      expect(hasSameProps({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    })
    it('should return false if some props are not same', () => {
      expect(hasSameProps({ a: 1 }, {})).toBe(false)
      expect(hasSameProps({}, { a: 1 })).toBe(false)
      expect(hasSameProps({ a: 1 }, { a: 2 })).toBe(false)
      expect(hasSameProps({ a: 1, b: 2 }, { a: 1, b: 8 })).toBe(false)
    })
  })

  describe('shiftMergeProps', () => {
    it('should return another if one of args is undefined', () => {
      const map = { a: 1 }
      expect(shiftMergeProps(map, undefined)).toEqual(map)
      expect(shiftMergeProps(undefined, map)).toEqual(map)
    })
    it('should drop a prop if map b has only the one prop and the prop is same between both maps', () => {
      const a = { a: 1, b: 1 }
      expect(shiftMergeProps(a, { b: 1 })).toEqual({ a: 1 })
      expect(shiftMergeProps(a, { b: 2 })).toEqual({ a: 1, b: 2 })
      expect(shiftMergeProps(a, { c: 1 })).toEqual({ a: 1, b: 1, c: 1 })
    })
    it('should merge individual props if map b has two more prop', () => {
      const a = { a: 1, b: 1 }
      const b = { b: 1, c: 1 }
      expect(shiftMergeProps(a, b)).toEqual({ ...a, ...b })
    })
    it('should return undefined if each props of two maps has same value', () => {
      const a = { a: 1 }
      expect(shiftMergeProps(a, a)).toBe(undefined)
      expect(shiftMergeProps(a, { a: 2 })).toEqual({ a: 2 })
    })
    it('should be enable custmize compare function', () => {
      const a = { a: 1 }
      expect(shiftMergeProps(a, { a: 10 }, (v1, v2) => v1 === v2 * 5)).toEqual({
        a: 10,
      })
      expect(shiftMergeProps(a, { a: 10 }, (v1, v2) => v1 === v2 / 10)).toBe(
        undefined
      )
    })
    it('should merge if each props of two maps does not have same value', () => {
      const a = { a: 1, c: 1 }
      const b = { a: 1, b: 1 }
      expect(shiftMergeProps(a, b)).toEqual({ ...a, ...b })
    })
    it('should merge if one of two maps has no props', () => {
      const a = { a: 1, c: 1 }
      const b = {}
      expect(shiftMergeProps(a, b)).toEqual(a)
      expect(shiftMergeProps(b, a)).toEqual(a)
    })
  })

  describe('mergeOrDropMap', () => {
    it('should merge new item if the value is not undefined', () => {
      expect(mergeOrDropMap({ a: 1 }, 'b', 2)).toEqual({ a: 1, b: 2 })
    })
    it('should drop a item if the value is undefined', () => {
      expect(mergeOrDropMap({ a: 1, b: 1 }, 'b', undefined)).toEqual({ a: 1 })
    })
  })

  describe('uniq', () => {
    it('should make an array with unique values', () => {
      expect(uniq([1, 1, 2, 2, 3])).toEqual([1, 2, 3])
      expect(uniq(['1', '1', '2', '2', '3'])).toEqual(['1', '2', '3'])
    })
    it('should inherit src order', () => {
      expect(uniq([1, 2, 3, 2])).toEqual([1, 2, 3])
    })
  })

  describe('resetId', () => {
    it('should reset id', () => {
      const src = { id: 'a', value: 1 }
      const ret = resetId(src)
      expect(ret.id).not.toBe(src.id)
    })
  })

  describe('getFirstProp', () => {
    it("should get first item's prop", () => {
      expect(getFirstProp([{ val: 2 }, { val: 1 }], 'val', 0 as number)).toBe(2)
    })
    it('should get default value if src is empty', () => {
      expect(getFirstProp([], 'val', 0 as number)).toBe(0)
    })
  })

  describe('splitList', () => {
    it('should split list by checkFn', () => {
      expect(splitList([1, 2, 3, 4, 5], (n) => n < 3)).toEqual([
        [1, 2],
        [3, 4, 5],
      ])
    })
  })

  describe('reduceToMap', () => {
    it('should return boolean map', () => {
      expect(reduceToMap(['a', 'b'], () => true)).toEqual({ a: true, b: true })
    })
  })

  describe('shallowEqual', () => {
    it('should return true if two args have the same key values in shallow', () => {
      expect(shallowEqual({}, {})).toBe(true)
      expect(shallowEqual({ a: 1 }, { a: 1 })).toBe(true)

      expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false)
      expect(shallowEqual({ a: 1 }, { b: 1 })).toBe(false)
      expect(shallowEqual({ a: 1 }, { a: 1, b: 1 })).toBe(false)
      expect(shallowEqual({ a: 1, b: 1 }, { a: 1 })).toBe(false)
    })
  })

  describe('xor', () => {
    it('should return xor boolean', () => {
      expect(xor(false, false)).toBe(false)
      expect(xor(false, true)).toBe(true)
      expect(xor(true, false)).toBe(true)
      expect(xor(true, true)).toBe(false)
    })
  })

  describe('getEntries', () => {
    const obj = { a: 1, b: 2, c: 3 }

    it('should return entries of the object', () => {
      expect(getEntries(obj)).toEqual(Object.entries(obj))
    })
    it('should ensure last item if lastKey is passed', () => {
      expect(getEntries(obj, 'b')[2]).toEqual(['b', 2])
    })
    it('should ignore lastKey if the value for it does not exist', () => {
      expect(getEntries(obj, 'd')).toEqual(Object.entries(obj))
    })
  })

  describe('thinOutSameItems', () => {
    it('should thin out interval items having the same attrs in a row', () => {
      expect(
        thinOutSameItems(
          [...Array(1)].map(() => ({ a: '1' })),
          hasSameProps
        )
      ).toEqual([{ a: '1' }])
      expect(
        thinOutSameItems(
          [...Array(2)].map(() => ({ a: '1' })),
          hasSameProps
        )
      ).toEqual([{ a: '1' }, { a: '1' }])
      expect(
        thinOutSameItems(
          [...Array(3)].map(() => ({ a: '1' })),
          hasSameProps
        )
      ).toEqual([{ a: '1' }, undefined, { a: '1' }])
      expect(
        thinOutSameItems(
          [...Array(4)].map(() => ({ a: '1' })),
          hasSameProps
        )
      ).toEqual([{ a: '1' }, undefined, undefined, { a: '1' }])
      expect(
        thinOutSameItems([{ a: '1' }, { b: '1' }, { a: '1' }], hasSameProps)
      ).toEqual([{ a: '1' }, { b: '1' }, { a: '1' }])
    })
    it('should not thin out items different from its sides', () => {
      expect(
        thinOutSameItems([{ a: '1' }, { b: '1' }, { a: '1' }], hasSameProps)
      ).toEqual([{ a: '1' }, { b: '1' }, { a: '1' }])
      expect(
        thinOutSameItems(
          [{ a: '1' }, { a: '1', b: '1' }, { a: '1' }],
          hasSameProps
        )
      ).toEqual([{ a: '1' }, { a: '1', b: '1' }, { a: '1' }])
    })
  })

  describe('thinOutSameAttributes', () => {
    it('should thin out interval attributes which are same in a row', () => {
      expect(
        thinOutSameAttributes([...Array(1)].map(() => ({ a: '1' })))
      ).toEqual([{ a: '1' }])
      expect(
        thinOutSameAttributes([...Array(2)].map(() => ({ a: '1' })))
      ).toEqual([{ a: '1' }, { a: '1' }])
      expect(
        thinOutSameAttributes([
          { a: '1', b: '2' },
          { a: '1', b: '22' },
          { a: '1', b: '222' },
          { a: '1', b: '2222' },
        ])
      ).toEqual([
        { a: '1', b: '2' },
        { b: '22' },
        { b: '222' },
        { a: '1', b: '2222' },
      ])
    })
    it('should replace undefined if thinned out items are empty', () => {
      expect(
        thinOutSameAttributes([...Array(3)].map(() => ({ a: '1' })))
      ).toEqual([{ a: '1' }, undefined, { a: '1' }])
      expect(
        thinOutSameAttributes([...Array(4)].map(() => ({ a: '1' })))
      ).toEqual([{ a: '1' }, undefined, undefined, { a: '1' }])
    })
    it('should deal undefined items', () => {
      expect(
        thinOutSameAttributes([{ a: '1' }, undefined, { a: '1' }])
      ).toEqual([{ a: '1' }, undefined, { a: '1' }])
    })
  })

  describe('thinOutList', () => {
    it('should thin out items', () => {
      expect(thinOutList([0, 1, 2, 3, 4, 5, 6], 1 / 2)).toEqual([0, 2, 4, 6])
      expect(thinOutList([0, 1, 2, 3, 4, 5, 6, 7], 1 / 2)).toEqual([0, 2, 4, 6])
      expect(thinOutList([0, 1, 2, 3, 4, 5, 6], 1 / 3)).toEqual([0, 3, 6])
      expect(thinOutList([0, 1, 2, 3, 4, 5, 6, 7, 8], 1 / 3)).toEqual([0, 3, 6])
    })
    it('should complete the edge when the option is passed', () => {
      expect(thinOutList([0, 1, 2, 3, 4, 5, 6], 1 / 2, true)).toEqual([
        0, 2, 4, 6,
      ])
      expect(thinOutList([0, 1, 2, 3, 4, 5, 6, 7], 1 / 2, true)).toEqual([
        0, 2, 4, 6, 7,
      ])
      expect(thinOutList([0, 1, 2, 3, 4, 5, 6], 1 / 3, true)).toEqual([0, 3, 6])
      expect(thinOutList([0, 1, 2, 3, 4, 5, 6, 7, 8], 1 / 3, true)).toEqual([
        0, 3, 6, 8,
      ])
    })
  })

  describe('isNotFalsy', () => {
    it('should return true if the value is not falsy', () => {
      expect(isNotNullish(null)).toBe(false)
      expect(isNotNullish(undefined)).toBe(false)

      expect(isNotNullish(false)).toBe(true)
      expect(isNotNullish(true)).toBe(true)
      expect(isNotNullish('')).toBe(true)
      expect(isNotNullish(0)).toBe(true)
      expect(isNotNullish({})).toBe(true)
    })
  })

  describe('dropNullishItem', () => {
    it('should drop nullish items', () => {
      expect(
        dropNullishItem({ a: 1, b: undefined, c: 0, d: '', f: null })
      ).toEqual({
        a: 1,
        c: 0,
        d: '',
      })
    })
  })
})
