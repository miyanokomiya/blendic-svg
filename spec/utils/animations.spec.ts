import {
  getAction,
  getArmature,
  getBorn,
  getKeyframe,
  getTransform,
  toMap,
} from '/@/models'
import {
  cleanActions,
  getNeighborKeyframes,
  interpolateKeyframeTransform,
  mergeKeyframes,
  mergeKeyframesWithDropped,
  slideKeyframesTo,
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

  describe('slideKeyframesTo', () => {
    it('do nothing if empty', () => {
      expect(slideKeyframesTo([], 10)).toEqual([])
    })
    it('slide keyframes to the frame', () => {
      expect(
        slideKeyframesTo(
          [
            getKeyframe({ id: '1', frame: 1 }),
            getKeyframe({ id: '2', frame: 2 }),
            getKeyframe({ id: '4', frame: 4 }),
          ],
          10
        )
      ).toEqual([
        getKeyframe({ id: '1', frame: 10 }),
        getKeyframe({ id: '2', frame: 11 }),
        getKeyframe({ id: '4', frame: 13 }),
      ])
    })
  })

  describe('mergeKeyframesWithDropped', () => {
    it('merge keyframes by the same frame and bornId', () => {
      const ret = mergeKeyframesWithDropped(
        [
          getKeyframe({ id: 'src_1_a', frame: 1, bornId: 'a' }),
          getKeyframe({ id: 'src_1_b', frame: 1, bornId: 'b' }),
          getKeyframe({ id: 'src_1_d', frame: 1, bornId: 'd' }),
          getKeyframe({ id: 'src_2_a', frame: 2, bornId: 'a' }),
        ],
        [
          getKeyframe({ id: 'ove_1_a', frame: 1, bornId: 'a' }),
          getKeyframe({ id: 'ove_2_b', frame: 2, bornId: 'b' }),
          getKeyframe({ id: 'ove_1_c', frame: 1, bornId: 'c' }),
          getKeyframe({ id: 'ove_3_c', frame: 3, bornId: 'c' }),
        ]
      )
      expect(toMap(ret.merged)).toEqual({
        src_1_b: getKeyframe({ id: 'src_1_b', frame: 1, bornId: 'b' }),
        src_1_d: getKeyframe({ id: 'src_1_d', frame: 1, bornId: 'd' }),
        src_2_a: getKeyframe({ id: 'src_2_a', frame: 2, bornId: 'a' }),
        ove_1_a: getKeyframe({ id: 'ove_1_a', frame: 1, bornId: 'a' }),
        ove_2_b: getKeyframe({ id: 'ove_2_b', frame: 2, bornId: 'b' }),
        ove_1_c: getKeyframe({ id: 'ove_1_c', frame: 1, bornId: 'c' }),
        ove_3_c: getKeyframe({ id: 'ove_3_c', frame: 3, bornId: 'c' }),
      })
      expect(toMap(ret.dropped)).toEqual({
        src_1_a: getKeyframe({ id: 'src_1_a', frame: 1, bornId: 'a' }),
      })
    })
    it('override keyframes by the same id', () => {
      const ret = mergeKeyframesWithDropped(
        [
          getKeyframe({ id: 'src_a', frame: 1, bornId: 'a' }),
          getKeyframe({ id: 'src_b', frame: 1, bornId: 'b' }),
        ],
        [getKeyframe({ id: 'src_b', frame: 10, bornId: 'bb' })]
      )
      expect(toMap(ret.merged)).toEqual({
        src_a: getKeyframe({ id: 'src_a', frame: 1, bornId: 'a' }),
        src_b: getKeyframe({ id: 'src_b', frame: 10, bornId: 'bb' }),
      })
      expect(toMap(ret.dropped)).toEqual({
        src_b: getKeyframe({ id: 'src_b', frame: 1, bornId: 'b' }),
      })
    })
  })

  describe('cleanActions', () => {
    it('drop actions of unexisted armatures', () => {
      expect(
        cleanActions(
          [
            getAction({ id: 'act_1', armatureId: 'arm_1' }),
            getAction({ id: 'act_2', armatureId: 'arm_2' }),
          ],
          [getArmature({ id: 'arm_2' })]
        )
      ).toEqual([getAction({ id: 'act_2', armatureId: 'arm_2' })])
    })
    it('drop keyframes of unexisted borns', () => {
      expect(
        cleanActions(
          [
            getAction({
              id: 'act_1',
              armatureId: 'arm_1',
              keyframes: [
                getKeyframe({ id: 'key_1', bornId: 'born_1', frame: 1 }),
                getKeyframe({ id: 'key_2', bornId: 'born_2', frame: 1 }),
                getKeyframe({ id: 'key_2', bornId: 'born_2', frame: 2 }),
                getKeyframe({ id: 'key_4', bornId: 'born_4', frame: 1 }),
              ],
            }),
          ],
          [
            getArmature({
              id: 'arm_1',
              borns: [getBorn({ id: 'born_2' }), getBorn({ id: 'born_3' })],
            }),
          ]
        )
      ).toEqual([
        getAction({
          id: 'act_1',
          armatureId: 'arm_1',
          keyframes: [
            getKeyframe({ id: 'key_2', bornId: 'born_2', frame: 1 }),
            getKeyframe({ id: 'key_2', bornId: 'born_2', frame: 2 }),
          ],
        }),
      ])
    })
  })
})
