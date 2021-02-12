import * as target from '../../src/utils/relations'

describe('utils/relations', () => {
  describe('getNextName', () => {
    it.each([
      ['name', [], 'name.001'],
      ['name.001', [], 'name.002'],
      ['name.009', [], 'name.010'],
      ['name.010', [], 'name.011'],
      ['name.999', [], 'name.1000'],
      ['name.1000', [], 'name.1001'],
    ])('src: %s, names: %s) => %s', (a, b, expected) => {
      expect(target.getNextName(a, b)).toBe(expected)
    })
    it.each([
      ['name', ['name.001'], 'name.002'],
      ['name.001', ['name.002', 'name.003'], 'name.004'],
    ])('src: %s, names: %s) => %s', (a, b, expected) => {
      expect(target.getNextName(a, b)).toBe(expected)
    })
  })
})
