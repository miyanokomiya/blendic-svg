import { getKeyframe } from '/@/models'
import { getNeighborKeyframes, sortKeyframeMap } from '/@/utils/animations'

describe('utils/animations.ts', () => {
  describe('sortKeyframeMap', () => {
    it('get sorted keyframes map', () => {
      expect(sortKeyframeMap({
        a: [
          getKeyframe({ frame: 2 }),
          getKeyframe({ frame: 3 }),
          getKeyframe({ frame: 1 }),
        ],
      })).toEqual({
        a: [
          getKeyframe({ frame: 1 }),
          getKeyframe({ frame: 2 }),
          getKeyframe({ frame: 3 }),
        ],
      })
    })
  })

  describe('getNeighborKeyframes', () => {
    it('get undefined if list is empty', () => {
      expect(getNeighborKeyframes([], 3)).toEqual(undefined)
    })
    it('get the keyframe if it has the frame', () => {
      expect(
        getNeighborKeyframes(
          [
            getKeyframe({ frame: 1 }),
            getKeyframe({ frame: 3 }),
            getKeyframe({ frame: 4 }),
          ],
          3
        )
      ).toEqual([getKeyframe({ frame: 3 })])
    })
    it('get the first keyframe if no one is smaller', () => {
      expect(
        getNeighborKeyframes(
          [
            getKeyframe({ frame: 4 }),
            getKeyframe({ frame: 5 }),
            getKeyframe({ frame: 6 }),
          ],
          3
        )
      ).toEqual([getKeyframe({ frame: 4 })])
    })
    it('get the last keyframe if no one is bigger', () => {
      expect(
        getNeighborKeyframes(
          [
            getKeyframe({ frame: 0 }),
            getKeyframe({ frame: 1 }),
            getKeyframe({ frame: 2 }),
          ],
          3
        )
      ).toEqual([getKeyframe({ frame: 2 })])
    })
    it('get the neighbor keyframes if they are exist', () => {
      expect(
        getNeighborKeyframes(
          [
            getKeyframe({ frame: 0 }),
            getKeyframe({ frame: 1 }),
            getKeyframe({ frame: 2 }),
            getKeyframe({ frame: 4 }),
          ],
          3
        )
      ).toEqual([getKeyframe({ frame: 2 }), getKeyframe({ frame: 4 })])
    })
  })
})
