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
  getKeyframeDefaultPropsMap,
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
              translateX: { value: 10, curve: { name: 'linear' } },
              translateY: { value: 20, curve: { name: 'linear' } },
            }),
            getKeyframeBone({
              frame: 1,
              translateX: { value: 100, curve: { name: 'linear' } },
              translateY: { value: 200, curve: { name: 'linear' } },
            }),
            getKeyframeBone({
              frame: 2,
            }),
            getKeyframeBone({
              frame: 4,
            }),
            getKeyframeBone({
              frame: 5,
              translateX: { value: 1000, curve: { name: 'linear' } },
              translateY: { value: 2000, curve: { name: 'linear' } },
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
              rotate: { value: 10, curve: { name: 'linear' } },
            }),
            getKeyframeBone({
              frame: 1,
              rotate: { value: 100, curve: { name: 'linear' } },
            }),
            getKeyframeBone({
              frame: 2,
            }),
            getKeyframeBone({
              frame: 4,
            }),
            getKeyframeBone({
              frame: 5,
              rotate: { value: 1000, curve: { name: 'linear' } },
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
              scaleX: { value: 10, curve: { name: 'linear' } },
              scaleY: { value: 20, curve: { name: 'linear' } },
            }),
            getKeyframeBone({
              frame: 1,
              scaleX: { value: 100, curve: { name: 'linear' } },
              scaleY: { value: 200, curve: { name: 'linear' } },
            }),
            getKeyframeBone({
              frame: 2,
            }),
            getKeyframeBone({
              frame: 4,
            }),
            getKeyframeBone({
              frame: 5,
              scaleX: { value: 1000, curve: { name: 'linear' } },
              scaleY: { value: 2000, curve: { name: 'linear' } },
            }),
          ],
          3
        )
      ).toEqual(getTransform({ scale: { x: 550, y: 1100 } }))
    })
  })

  describe('inversedSelectedState', () => {
    it('inverse selected state', () => {
      expect(
        target.inversedSelectedState(
          {
            name: 'bone',
            translateX: true,
            scaleX: true,
          },
          {
            name: 'bone',
            translateX: true,
            rotate: true,
          }
        )
      ).toEqual({
        name: 'bone',
        rotate: true,
        scaleX: true,
      })
    })
    it('do nothing if target is empty', () => {
      expect(
        target.inversedSelectedState(target.getAllSelectedState(), {
          name: 'bone',
        })
      ).toEqual(target.getAllSelectedState())
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
                [prop]: true,
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
          translateX: getKeyframePoint(),
          translateY: getKeyframePoint(),
          rotate: getKeyframePoint(),
          scaleX: getKeyframePoint(),
          scaleY: getKeyframePoint(),
        }),
        {
          name: 'bone',
          translateX: true,
          translateY: true,
          rotate: true,
          scaleX: true,
          scaleY: true,
        }
      )
      expect(ret.notSelected).toBe(undefined)
      expect(ret.selected).toEqual(
        getKeyframeBone({
          translateX: getKeyframePoint(),
          translateY: getKeyframePoint(),
          rotate: getKeyframePoint(),
          scaleX: getKeyframePoint(),
          scaleY: getKeyframePoint(),
        })
      )
    })
    it('not selected', () => {
      const ret = target.splitKeyframeBySelected(
        getKeyframeBone({
          translateX: getKeyframePoint(),
          translateY: getKeyframePoint(),
          rotate: getKeyframePoint(),
          scaleX: getKeyframePoint(),
          scaleY: getKeyframePoint(),
        }),
        { name: 'bone' }
      )
      expect(ret.selected).toBe(undefined)
      expect(ret.notSelected).toEqual(
        getKeyframeBone({
          translateX: getKeyframePoint(),
          translateY: getKeyframePoint(),
          rotate: getKeyframePoint(),
          scaleX: getKeyframePoint(),
          scaleY: getKeyframePoint(),
        })
      )
    })
    it('all existed selected', () => {
      const ret = target.splitKeyframeBySelected(
        getKeyframeBone({
          rotate: getKeyframePoint(),
        }),
        {
          name: 'bone',
          rotate: true,
        }
      )
      expect(ret.selected).toEqual(
        getKeyframeBone({
          rotate: getKeyframePoint(),
        })
      )
      expect(ret.notSelected).toBe(undefined)
    })
  })

  describe('mergeKeyframes', () => {
    it('merge two keyframes', () => {
      const src = getKeyframeBone({
        translateX: getKeyframePoint({ value: 10 }),
        translateY: getKeyframePoint({ value: 20 }),
      })
      const override = getKeyframeBone({
        translateX: getKeyframePoint({ value: 100 }),
        rotate: getKeyframePoint({ value: 300 }),
      })
      expect(target.mergeKeyframes(src, override)).toEqual(
        getKeyframeBone({
          translateX: getKeyframePoint({ value: 100 }),
          translateY: getKeyframePoint({ value: 20 }),
          rotate: getKeyframePoint({ value: 300 }),
        })
      )
    })
  })

  describe('deleteKeyframeByProp', () => {
    it('not selected', () => {
      expect(
        target.deleteKeyframeByProp(
          getKeyframeBone({
            translateX: getKeyframePoint({ value: 100 }),
            translateY: getKeyframePoint({ value: 20 }),
            rotate: getKeyframePoint({ value: 300 }),
          })
        )
      ).toEqual(
        getKeyframeBone({
          translateX: getKeyframePoint({ value: 100 }),
          translateY: getKeyframePoint({ value: 20 }),
          rotate: getKeyframePoint({ value: 300 }),
        })
      )
    })
    it('delete all', () => {
      expect(
        target.deleteKeyframeByProp(
          getKeyframeBone({
            translateX: getKeyframePoint({ value: 100 }),
            translateY: getKeyframePoint({ value: 20 }),
            rotate: getKeyframePoint({ value: 300 }),
          }),
          {
            name: 'bone',
            translateX: true,
            translateY: true,
            rotate: true,
          }
        )
      ).toBe(undefined)
    })
    it('delete props', () => {
      expect(
        target.deleteKeyframeByProp(
          getKeyframeBone({
            translateX: getKeyframePoint({ value: 100 }),
            translateY: getKeyframePoint({ value: 20 }),
            rotate: getKeyframePoint({ value: 300 }),
          }),
          {
            name: 'bone',
            translateX: true,
          }
        )
      ).toEqual(
        getKeyframeBone({
          translateY: getKeyframePoint({ value: 20 }),
          rotate: getKeyframePoint({ value: 300 }),
        })
      )
    })
  })

  describe('getKeyframePropsMap', () => {
    it('get map', () => {
      const key1 = getKeyframeBone({
        frame: 1,
        translateX: getKeyframePoint({ value: 1 }),
      })
      const key2 = getKeyframeBone({
        frame: 2,
        translateX: getKeyframePoint({ value: 2 }),
        translateY: getKeyframePoint({ value: 20 }),
      })
      const key3 = getKeyframeBone({
        frame: 3,
        rotate: getKeyframePoint(),
        scaleX: getKeyframePoint(),
        scaleY: getKeyframePoint(),
      })

      const ret = target.getKeyframePropsMap([key1, key2, key3])
      expect(ret.translateX).toEqual([key1, key2])
      expect(ret.translateY).toEqual([key2])
      expect(ret.rotate).toEqual([key3])
      expect(ret.scaleX).toEqual([key3])
      expect(ret.scaleY).toEqual([key3])
    })
  })

  describe('getSamePropRangeFrameMapByBoneId', () => {
    it('get same range frame map by bone id', () => {
      const t1 = getKeyframePoint({ value: 0 })
      const t2 = getKeyframePoint({ value: 45 })
      const res = getSamePropRangeFrameMapByBoneId({
        a: [
          getKeyframeBone({ frame: 0, rotate: t1 }),
          getKeyframeBone({ frame: 3, rotate: t1 }),
          getKeyframeBone({ frame: 5, rotate: t2 }),
        ],
        b: [getKeyframeBone({ frame: 0, rotate: t1 })],
        c: [],
      })
      expect(res.a).toEqual({
        0: { all: 0, ...getKeyframeDefaultPropsMap(() => 0), rotate: 3 },
        3: { all: 0, ...getKeyframeDefaultPropsMap(() => 0) },
        5: { all: 0, ...getKeyframeDefaultPropsMap(() => 0) },
      })
      expect(res.b).toEqual({
        0: { all: 0, ...getKeyframeDefaultPropsMap(() => 0) },
      })
      expect(res.c).toEqual({})
    })
  })

  describe('getSamePropRangeFrameMap', () => {
    const t1 = getKeyframePoint({ value: 0 })
    const t2 = getKeyframePoint({ value: 45 })

    it('translateX', () => {
      const list = [
        getKeyframeBone({ frame: 0, translateX: t1 }),
        getKeyframeBone({ frame: 3, translateX: t1 }),
        getKeyframeBone({ frame: 5, translateX: t1 }),
        getKeyframeBone({ frame: 5, translateX: t2 }),
      ]
      expect(getSamePropRangeFrameMap(list, 0).translateX).toEqual(3)
      expect(getSamePropRangeFrameMap(list, 1).translateX).toEqual(2)
      expect(getSamePropRangeFrameMap(list, 2).translateX).toEqual(0)
    })
    it('translateY', () => {
      const list = [
        getKeyframeBone({ frame: 0, translateY: t1 }),
        getKeyframeBone({ frame: 3, translateY: t1 }),
        getKeyframeBone({ frame: 5, translateY: t1 }),
        getKeyframeBone({ frame: 5, translateY: t2 }),
      ]
      expect(getSamePropRangeFrameMap(list, 0).translateY).toEqual(3)
      expect(getSamePropRangeFrameMap(list, 1).translateY).toEqual(2)
      expect(getSamePropRangeFrameMap(list, 2).translateY).toEqual(0)
    })
    it('rotate', () => {
      const list = [
        getKeyframeBone({ frame: 0, rotate: t1 }),
        getKeyframeBone({ frame: 3, rotate: t1 }),
        getKeyframeBone({ frame: 5, rotate: t1 }),
        getKeyframeBone({ frame: 5, rotate: t2 }),
      ]
      expect(getSamePropRangeFrameMap(list, 0).rotate).toEqual(3)
      expect(getSamePropRangeFrameMap(list, 1).rotate).toEqual(2)
      expect(getSamePropRangeFrameMap(list, 2).rotate).toEqual(0)
    })
    it('scaleX', () => {
      const list = [
        getKeyframeBone({ frame: 0, scaleX: t1 }),
        getKeyframeBone({ frame: 3, scaleX: t1 }),
        getKeyframeBone({ frame: 5, scaleX: t1 }),
        getKeyframeBone({ frame: 5, scaleX: t2 }),
      ]
      expect(getSamePropRangeFrameMap(list, 0).scaleX).toEqual(3)
      expect(getSamePropRangeFrameMap(list, 1).scaleX).toEqual(2)
      expect(getSamePropRangeFrameMap(list, 2).scaleX).toEqual(0)
    })
    it('scaleY', () => {
      const list = [
        getKeyframeBone({ frame: 0, scaleY: t1 }),
        getKeyframeBone({ frame: 3, scaleY: t1 }),
        getKeyframeBone({ frame: 5, scaleY: t1 }),
        getKeyframeBone({ frame: 5, scaleY: t2 }),
      ]
      expect(getSamePropRangeFrameMap(list, 0).scaleY).toEqual(3)
      expect(getSamePropRangeFrameMap(list, 1).scaleY).toEqual(2)
      expect(getSamePropRangeFrameMap(list, 2).scaleY).toEqual(0)
    })
    it('all prop equals min value', () => {
      const list = [
        getKeyframeBone({
          frame: 0,
          translateX: t1,
          translateY: t1,
          rotate: t1,
          scaleX: t1,
          scaleY: t1,
        }),
        getKeyframeBone({
          frame: 3,
          translateX: t1,
          translateY: t1,
          rotate: t1,
          scaleX: t1,
          scaleY: t1,
        }),
        getKeyframeBone({
          frame: 4,
          translateY: t1,
          rotate: t1,
          scaleX: t1,
          scaleY: t1,
        }),
      ]
      expect(getSamePropRangeFrameMap(list, 0)).toEqual({
        all: 3,
        ...getKeyframeDefaultPropsMap(() => 3),
      })
      expect(getSamePropRangeFrameMap(list, 1)).toEqual({
        all: 0,
        ...getKeyframeDefaultPropsMap(() => 1),
        translateX: 0,
      })
    })
  })
})
