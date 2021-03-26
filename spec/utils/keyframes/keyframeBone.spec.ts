/*
This file is part of Blendic SVG.

Blendic SVG is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Blendic SVG is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Blendic SVG.  If not, see <https://www.gnu.org/licenses/>.

Copyright (C) 2021, Tomoya Komiyama.
*/

import { getTransform } from '/@/models'
import { getKeyframeBone, getKeyframePoint } from '/@/models/keyframe'
import * as target from '/@/utils/keyframes/keyframeBone'
import {
  getSamePropRangeFrameMap,
  getSamePropRangeFrameMapByBoneId,
} from '/@/utils/keyframes/keyframeBone'

describe('utils/keyframes/index.ts', () => {
  describe('interpolateKeyframe', () => {
    it('translate', () => {
      expect(
        target.interpolateKeyframe(
          [
            getKeyframeBone({
              frame: 0,
              points: {
                translateX: { value: 10, curve: { name: 'linear' } },
                translateY: { value: 20, curve: { name: 'linear' } },
              },
            }),
            getKeyframeBone({
              frame: 1,
              points: {
                translateX: { value: 100, curve: { name: 'linear' } },
                translateY: { value: 200, curve: { name: 'linear' } },
              },
            }),
            getKeyframeBone({
              frame: 2,
            }),
            getKeyframeBone({
              frame: 4,
            }),
            getKeyframeBone({
              frame: 5,
              points: {
                translateX: { value: 1000, curve: { name: 'linear' } },
                translateY: { value: 2000, curve: { name: 'linear' } },
              },
            }),
          ],
          3
        )
      ).toEqual(getTransform({ translate: { x: 550, y: 1100 } }))
    })
    it('rotate', () => {
      expect(
        target.interpolateKeyframe(
          [
            getKeyframeBone({
              frame: 0,
              points: {
                rotate: { value: 10, curve: { name: 'linear' } },
              },
            }),
            getKeyframeBone({
              frame: 1,
              points: {
                rotate: { value: 100, curve: { name: 'linear' } },
              },
            }),
            getKeyframeBone({
              frame: 2,
            }),
            getKeyframeBone({
              frame: 4,
            }),
            getKeyframeBone({
              frame: 5,
              points: {
                rotate: { value: 1000, curve: { name: 'linear' } },
              },
            }),
          ],
          3
        )
      ).toEqual(getTransform({ rotate: 550 }))
    })
    it('scale', () => {
      expect(
        target.interpolateKeyframe(
          [
            getKeyframeBone({
              frame: 0,
              points: {
                scaleX: { value: 10, curve: { name: 'linear' } },
                scaleY: { value: 20, curve: { name: 'linear' } },
              },
            }),
            getKeyframeBone({
              frame: 1,
              points: {
                scaleX: { value: 100, curve: { name: 'linear' } },
                scaleY: { value: 200, curve: { name: 'linear' } },
              },
            }),
            getKeyframeBone({
              frame: 2,
            }),
            getKeyframeBone({
              frame: 4,
            }),
            getKeyframeBone({
              frame: 5,
              points: {
                scaleX: { value: 1000, curve: { name: 'linear' } },
                scaleY: { value: 2000, curve: { name: 'linear' } },
              },
            }),
          ],
          3
        )
      ).toEqual(getTransform({ scale: { x: 550, y: 1100 } }))
    })
  })

  describe('isAllExistSelected', () => {
    it('return true if all existed props is selected', () => {
      ;['translateX', 'translateY', 'rotete', 'scaleX', 'scaleY'].forEach(
        (prop) => {
          expect(
            target.isAllExistSelected(
              getKeyframeBone({
                [prop]: getKeyframePoint(),
              }),
              {
                name: 'bone',
                props: {
                  [prop]: true,
                },
              }
            )
          ).toBe(true)
        }
      )
    })
  })

  describe('splitKeyframeBySelected', () => {
    it('selected', () => {
      const ret = target.splitKeyframeBySelected(
        getKeyframeBone({
          points: {
            translateX: getKeyframePoint(),
            translateY: getKeyframePoint(),
            rotate: getKeyframePoint(),
            scaleX: getKeyframePoint(),
            scaleY: getKeyframePoint(),
          },
        }),
        {
          name: 'bone',
          props: {
            translateX: true,
            translateY: true,
            rotate: true,
            scaleX: true,
            scaleY: true,
          },
        }
      )
      expect(ret.notSelected).toBe(undefined)
      expect(ret.selected).toEqual(
        getKeyframeBone({
          points: {
            translateX: getKeyframePoint(),
            translateY: getKeyframePoint(),
            rotate: getKeyframePoint(),
            scaleX: getKeyframePoint(),
            scaleY: getKeyframePoint(),
          },
        })
      )
    })
    it('not selected', () => {
      const ret = target.splitKeyframeBySelected(
        getKeyframeBone({
          points: {
            translateX: getKeyframePoint(),
            translateY: getKeyframePoint(),
            rotate: getKeyframePoint(),
            scaleX: getKeyframePoint(),
            scaleY: getKeyframePoint(),
          },
        }),
        { name: 'bone', props: {} }
      )
      expect(ret.selected).toBe(undefined)
      expect(ret.notSelected).toEqual(
        getKeyframeBone({
          points: {
            translateX: getKeyframePoint(),
            translateY: getKeyframePoint(),
            rotate: getKeyframePoint(),
            scaleX: getKeyframePoint(),
            scaleY: getKeyframePoint(),
          },
        })
      )
    })
    it('all existed selected', () => {
      const ret = target.splitKeyframeBySelected(
        getKeyframeBone({
          points: {
            rotate: getKeyframePoint(),
          },
        }),
        {
          name: 'bone',
          props: {
            rotate: true,
          },
        }
      )
      expect(ret.selected).toEqual(
        getKeyframeBone({
          points: {
            rotate: getKeyframePoint(),
          },
        })
      )
      expect(ret.notSelected).toBe(undefined)
    })
  })

  describe('mergeKeyframes', () => {
    it('merge two keyframes', () => {
      const src = getKeyframeBone({
        points: {
          translateX: getKeyframePoint({ value: 10 }),
          translateY: getKeyframePoint({ value: 20 }),
        },
      })
      const override = getKeyframeBone({
        points: {
          translateX: getKeyframePoint({ value: 100 }),
          rotate: getKeyframePoint({ value: 300 }),
        },
      })
      expect(target.mergeKeyframes(src, override)).toEqual(
        getKeyframeBone({
          points: {
            translateX: getKeyframePoint({ value: 100 }),
            translateY: getKeyframePoint({ value: 20 }),
            rotate: getKeyframePoint({ value: 300 }),
          },
        })
      )
    })
  })

  describe('deleteKeyframeByProp', () => {
    it('not selected', () => {
      expect(
        target.deleteKeyframeByProp(
          getKeyframeBone({
            points: {
              translateX: getKeyframePoint({ value: 100 }),
              translateY: getKeyframePoint({ value: 20 }),
              rotate: getKeyframePoint({ value: 300 }),
            },
          })
        )
      ).toEqual(
        getKeyframeBone({
          points: {
            translateX: getKeyframePoint({ value: 100 }),
            translateY: getKeyframePoint({ value: 20 }),
            rotate: getKeyframePoint({ value: 300 }),
          },
        })
      )
    })
    it('delete all', () => {
      expect(
        target.deleteKeyframeByProp(
          getKeyframeBone({
            points: {
              translateX: getKeyframePoint({ value: 100 }),
              translateY: getKeyframePoint({ value: 20 }),
              rotate: getKeyframePoint({ value: 300 }),
            },
          }),
          {
            name: 'bone',
            props: {
              translateX: true,
              translateY: true,
              rotate: true,
            },
          }
        )
      ).toBe(undefined)
    })
    it('delete props', () => {
      expect(
        target.deleteKeyframeByProp(
          getKeyframeBone({
            points: {
              translateX: getKeyframePoint({ value: 100 }),
              translateY: getKeyframePoint({ value: 20 }),
              rotate: getKeyframePoint({ value: 300 }),
            },
          }),
          {
            name: 'bone',
            props: {
              translateX: true,
            },
          }
        )
      ).toEqual(
        getKeyframeBone({
          points: {
            translateY: getKeyframePoint({ value: 20 }),
            rotate: getKeyframePoint({ value: 300 }),
          },
        })
      )
    })
  })

  describe('getKeyframePropsMap', () => {
    it('get map', () => {
      const key1 = getKeyframeBone({
        frame: 1,
        points: {
          translateX: getKeyframePoint({ value: 1 }),
        },
      })
      const key2 = getKeyframeBone({
        frame: 2,
        points: {
          translateX: getKeyframePoint({ value: 2 }),
          translateY: getKeyframePoint({ value: 20 }),
        },
      })
      const key3 = getKeyframeBone({
        frame: 3,
        points: {
          rotate: getKeyframePoint(),
          scaleX: getKeyframePoint(),
          scaleY: getKeyframePoint(),
        },
      })

      const ret = target.getKeyframePropsMap([key1, key2, key3])
      expect(ret.props.translateX).toEqual([key1, key2])
      expect(ret.props.translateY).toEqual([key2])
      expect(ret.props.rotate).toEqual([key3])
      expect(ret.props.scaleX).toEqual([key3])
      expect(ret.props.scaleY).toEqual([key3])
    })
  })

  describe('getSamePropRangeFrameMapByBoneId', () => {
    it('get same range frame map by bone id', () => {
      const t1 = getKeyframePoint({ value: 0 })
      const t2 = getKeyframePoint({ value: 45 })
      const res = getSamePropRangeFrameMapByBoneId({
        a: [
          getKeyframeBone({ frame: 0, points: { rotate: t1 } }),
          getKeyframeBone({ frame: 3, points: { rotate: t1 } }),
          getKeyframeBone({ frame: 5, points: { rotate: t2 } }),
        ],
        b: [getKeyframeBone({ frame: 0, points: { rotate: t1 } })],
        c: [],
      })
      expect(res.a).toEqual({
        0: {
          name: 'bone',
          props: {
            rotate: 3,
          },
        },
        3: {
          name: 'bone',
          props: { rotate: 0 },
        },
        5: {
          name: 'bone',
          props: { rotate: 0 },
        },
      })
      expect(res.b).toEqual({
        0: {
          name: 'bone',
          props: { rotate: 0 },
        },
      })
      expect(res.c).toEqual({})
    })
  })

  describe('getSamePropRangeFrameMap', () => {
    const t1 = getKeyframePoint({ value: 0 })
    const t2 = getKeyframePoint({ value: 45 })

    it('translateX', () => {
      const list = [
        getKeyframeBone({ frame: 0, points: { translateX: t1 } }),
        getKeyframeBone({ frame: 3, points: { translateX: t1 } }),
        getKeyframeBone({ frame: 5, points: { translateX: t1 } }),
        getKeyframeBone({ frame: 5, points: { translateX: t2 } }),
      ]
      expect(getSamePropRangeFrameMap(list, 0).props.translateX).toEqual(3)
      expect(getSamePropRangeFrameMap(list, 1).props.translateX).toEqual(2)
      expect(getSamePropRangeFrameMap(list, 2).props.translateX).toEqual(0)
    })
    it('translateY', () => {
      const list = [
        getKeyframeBone({ frame: 0, points: { translateY: t1 } }),
        getKeyframeBone({ frame: 3, points: { translateY: t1 } }),
        getKeyframeBone({ frame: 5, points: { translateY: t1 } }),
        getKeyframeBone({ frame: 5, points: { translateY: t2 } }),
      ]
      expect(getSamePropRangeFrameMap(list, 0).props.translateY).toEqual(3)
      expect(getSamePropRangeFrameMap(list, 1).props.translateY).toEqual(2)
      expect(getSamePropRangeFrameMap(list, 2).props.translateY).toEqual(0)
    })
    it('rotate', () => {
      const list = [
        getKeyframeBone({ frame: 0, points: { rotate: t1 } }),
        getKeyframeBone({ frame: 3, points: { rotate: t1 } }),
        getKeyframeBone({ frame: 5, points: { rotate: t1 } }),
        getKeyframeBone({ frame: 5, points: { rotate: t2 } }),
      ]
      expect(getSamePropRangeFrameMap(list, 0).props.rotate).toEqual(3)
      expect(getSamePropRangeFrameMap(list, 1).props.rotate).toEqual(2)
      expect(getSamePropRangeFrameMap(list, 2).props.rotate).toEqual(0)
    })
    it('scaleX', () => {
      const list = [
        getKeyframeBone({ frame: 0, points: { scaleX: t1 } }),
        getKeyframeBone({ frame: 3, points: { scaleX: t1 } }),
        getKeyframeBone({ frame: 5, points: { scaleX: t1 } }),
        getKeyframeBone({ frame: 5, points: { scaleX: t2 } }),
      ]
      expect(getSamePropRangeFrameMap(list, 0).props.scaleX).toEqual(3)
      expect(getSamePropRangeFrameMap(list, 1).props.scaleX).toEqual(2)
      expect(getSamePropRangeFrameMap(list, 2).props.scaleX).toEqual(0)
    })
    it('scaleY', () => {
      const list = [
        getKeyframeBone({ frame: 0, points: { scaleY: t1 } }),
        getKeyframeBone({ frame: 3, points: { scaleY: t1 } }),
        getKeyframeBone({ frame: 5, points: { scaleY: t1 } }),
        getKeyframeBone({ frame: 5, points: { scaleY: t2 } }),
      ]
      expect(getSamePropRangeFrameMap(list, 0).props.scaleY).toEqual(3)
      expect(getSamePropRangeFrameMap(list, 1).props.scaleY).toEqual(2)
      expect(getSamePropRangeFrameMap(list, 2).props.scaleY).toEqual(0)
    })
  })
})
