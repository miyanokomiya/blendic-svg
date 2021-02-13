import { useCanvasStore } from '../../src/store/canvas'

describe('store/canvas.ts', () => {
  describe('isOppositeSide', () => {
    const canvasStore = useCanvasStore()
    it('returns false if same side', () => {
      expect(
        canvasStore.isOppositeSide(
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 }
        )
      ).toBe(false)
      expect(
        canvasStore.isOppositeSide(
          { x: 0, y: 0 },
          { x: -1, y: 0 },
          { x: -1, y: 1 }
        )
      ).toBe(false)
      expect(
        canvasStore.isOppositeSide(
          { x: 0, y: 0 },
          { x: -1, y: -1 },
          { x: -1, y: 0 }
        )
      ).toBe(false)
    })
    it('returns true if opposite side', () => {
      expect(
        canvasStore.isOppositeSide(
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: -1, y: 1 }
        )
      ).toBe(true)
      expect(
        canvasStore.isOppositeSide(
          { x: 0, y: 0 },
          { x: -1, y: 0 },
          { x: 1, y: 1 }
        )
      ).toBe(true)
      expect(
        canvasStore.isOppositeSide(
          { x: 0, y: 0 },
          { x: -1, y: -1 },
          { x: 1, y: 0 }
        )
      ).toBe(true)
    })
  })
})
