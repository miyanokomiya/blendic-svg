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
import * as target from '/@/utils/keyframes'

describe('utils/keyframes/index.ts', () => {
  describe('interpolateKeyframeBone', () => {
    it('translate', () => {
      expect(
        target.interpolateKeyframeBone(
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
        target.interpolateKeyframeBone(
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
        target.interpolateKeyframeBone(
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
          { translateX: true, scaleX: true },
          { translateX: true, rotate: true }
        )
      ).toEqual({
        rotate: true,
        scaleX: true,
      })
    })
    it('do nothing if target is empty', () => {
      expect(
        target.inversedSelectedState(target.getAllSelectedState(), {})
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
              { [prop]: true }
            )
          ).toBe(true)
        }
      )
    })
  })

  describe('splitKeyframeBoneBySelected', () => {
    it('selected', () => {
      const ret = target.splitKeyframeBoneBySelected(
        getKeyframeBone({
          translateX: getKeyframePoint(),
          translateY: getKeyframePoint(),
          rotate: getKeyframePoint(),
          scaleX: getKeyframePoint(),
          scaleY: getKeyframePoint(),
        }),
        {
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
      const ret = target.splitKeyframeBoneBySelected(
        getKeyframeBone({
          translateX: getKeyframePoint(),
          translateY: getKeyframePoint(),
          rotate: getKeyframePoint(),
          scaleX: getKeyframePoint(),
          scaleY: getKeyframePoint(),
        }),
        {}
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
      const ret = target.splitKeyframeBoneBySelected(
        getKeyframeBone({
          rotate: getKeyframePoint(),
        }),
        { rotate: true }
      )
      expect(ret.selected).toEqual(
        getKeyframeBone({
          rotate: getKeyframePoint(),
        })
      )
      expect(ret.notSelected).toBe(undefined)
    })
  })

  describe('mergeKeyframeBones', () => {
    it('merge two keyframes', () => {
      const src = getKeyframeBone({
        translateX: getKeyframePoint({ value: 10 }),
        translateY: getKeyframePoint({ value: 20 }),
      })
      const override = getKeyframeBone({
        translateX: getKeyframePoint({ value: 100 }),
        rotate: getKeyframePoint({ value: 300 }),
      })
      expect(target.mergeKeyframeBones(src, override)).toEqual(
        getKeyframeBone({
          translateX: getKeyframePoint({ value: 100 }),
          translateY: getKeyframePoint({ value: 20 }),
          rotate: getKeyframePoint({ value: 300 }),
        })
      )
    })
  })

  describe('deleteKeyframeBoneByProp', () => {
    it('not selected', () => {
      expect(
        target.deleteKeyframeBoneByProp(
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
        target.deleteKeyframeBoneByProp(
          getKeyframeBone({
            translateX: getKeyframePoint({ value: 100 }),
            translateY: getKeyframePoint({ value: 20 }),
            rotate: getKeyframePoint({ value: 300 }),
          }),
          {
            translateX: true,
            translateY: true,
            rotate: true,
          }
        )
      ).toBe(undefined)
    })
    it('delete props', () => {
      expect(
        target.deleteKeyframeBoneByProp(
          getKeyframeBone({
            translateX: getKeyframePoint({ value: 100 }),
            translateY: getKeyframePoint({ value: 20 }),
            rotate: getKeyframePoint({ value: 300 }),
          }),
          {
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

  describe('getKeyframeBonePropsMap', () => {
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

      const ret = target.getKeyframeBonePropsMap([key1, key2, key3])
      expect(ret.translateX).toEqual([key1, key2])
      expect(ret.translateY).toEqual([key2])
      expect(ret.rotate).toEqual([key3])
      expect(ret.scaleX).toEqual([key3])
      expect(ret.scaleY).toEqual([key3])
    })
  })
})
