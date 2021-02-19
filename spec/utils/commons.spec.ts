import { dropKeys, toKeyMap, toList } from '/@/utils/commons'

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
})
