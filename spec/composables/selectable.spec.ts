import { useAttrsSelectable } from '../../src/composables/selectable'

describe('src/composables/selectable.ts', () => {
  describe('useAttrsSelectable', () => {
    const items = {
      a: { id: 'a' },
      b: { id: 'b' },
    }
    describe('allAttrsSelectedIds', () => {
      it('should return computed ids whose all attrs have been selected', () => {
        const target = useAttrsSelectable(() => items, ['x', 'y'])
        const ret = target.allAttrsSelectedIds
        expect(ret.value).toEqual([])
        target.select('a', 'x', true)
        expect(ret.value).toEqual([])
        target.select('a', 'y', true)
        expect(ret.value).toEqual(['a'])
        target.multiSelect({ b: { x: true, y: true } }, true)
        expect(ret.value).toEqual(['a', 'b'])
      })
    })
  })
})
