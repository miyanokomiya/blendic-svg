import {
  dropListByKey,
  dropMap,
  dropMapIfFalse,
  extractMap,
  flatKeyListMap,
  getParentIdPath,
  mapReduce,
  mergeListByKey,
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
})
