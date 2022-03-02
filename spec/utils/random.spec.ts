import { generateUuid } from '/@/utils/random'

describe('src/utils/random.ts', () => {
  describe('generateUuid', () => {
    it('should return uuid', () => {
      expect(generateUuid()).not.toBe(generateUuid())
    })
  })
})
