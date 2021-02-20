import {
  dropKeys,
  dropMap,
  dropMapIf,
  extractMap,
  flatKeyListMap,
  mapReduce,
  toKeyListMap,
  toKeyMap,
  toList,
} from '/@/utils/commons'

describe('utils/commons.ts', () => {
  describe('dropKeys', () => {
    it('drop target keys', () => {
      expect(
        dropKeys({ a: 1, b: 2, c: 3, d: 4 }, { b: true, c: undefined })
      ).toEqual({
        a: 1,
        d: 4,
      })
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

  describe('dropMapIf', () => {
    it('drop origin if returns false', () => {
      expect(
        dropMapIf(
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
})
