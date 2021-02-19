import { getKeyframe, getTransform } from '/@/models'
import {
  getNeighborKeyframes,
  interpolateKeyframeTransform,
  sortKeyframeMap,
} from '/@/utils/animations'

describe('utils/animations.ts', () => {
  describe('sortKeyframeMap', () => {
    it('get sorted keyframes map', () => {
      expect(
        sortKeyframeMap({
          a: [
            getKeyframe({ frame: 2 }),
            getKeyframe({ frame: 3 }),
            getKeyframe({ frame: 1 }),
          ],
        })
      ).toEqual({
        a: [
          getKeyframe({ frame: 1 }),
          getKeyframe({ frame: 2 }),
          getKeyframe({ frame: 3 }),
        ],
      })
    })
  })

  describe('getNeighborKeyframes', () => {
    it('get empty if list is empty', () => {
      expect(getNeighborKeyframes([], 3)).toEqual([])
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

  describe('interpolateKeyframeTransform', () => {
    it('get unit transform if no keyframe exists', () => {
      const ret = interpolateKeyframeTransform([], 1)
      expect(ret).toEqual(getTransform())
    })
    it('get the same transform if one keyframe exists', () => {
      const ret = interpolateKeyframeTransform(
        [
          getKeyframe({
            transform: getTransform({ rotate: 20 }),
          }),
        ],
        1
      )
      expect(ret).toEqual(getTransform({ rotate: 20 }))
    })
    it('get interpolated transform if two keyframe exist', () => {
      const ret = interpolateKeyframeTransform(
        [
          getKeyframe({
            frame: 10,
            transform: getTransform({ rotate: 20 }),
          }),
          getKeyframe({
            frame: 20,
            transform: getTransform({ rotate: 30 }),
          }),
        ],
        12
      )
      expect(ret.rotate).toBeCloseTo(22)
    })
    it('custom curve func', () => {
      const ret = interpolateKeyframeTransform(
        [
          getKeyframe({
            frame: 10,
            transform: getTransform({ rotate: 20 }),
          }),
          getKeyframe({
            frame: 20,
            transform: getTransform({ rotate: 30 }),
          }),
        ],
        12,
        (x: number) => Math.pow(x, 2)
      )
      expect(ret.rotate).toBeCloseTo(20.4)
    })
  })
})
