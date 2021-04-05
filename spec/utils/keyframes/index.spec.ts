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

import { getKeyframeBone, getKeyframePoint } from '/@/models/keyframe'
import * as target from '/@/utils/keyframes'
import * as keyframeBoneModule from '/@/utils/keyframes/keyframeBone'

describe('utils/keyframes/index.ts', () => {
  describe('getKeyframeModule', () => {
    it('get keyframeBoneModule', () => {
      const ret = target.getKeyframeModule('bone')
      expect(ret).toEqual(keyframeBoneModule)
    })
  })

  describe('inversedSelectedState', () => {
    it('inverse selected state', () => {
      expect(
        target.inversedSelectedState(
          {
            name: 'bone',
            props: {
              translateX: true,
              scaleX: true,
            },
          },
          {
            name: 'bone',
            props: {
              translateX: true,
              rotate: true,
            },
          }
        )
      ).toEqual({
        name: 'bone',
        props: {
          rotate: true,
          scaleX: true,
        },
      })
    })
    it('do nothing if target property is empty', () => {
      expect(
        target.inversedSelectedState(
          target.getAllSelectedState(
            getKeyframeBone({
              points: {
                ...target.getKeyframeDefaultPropsMap(
                  () => getKeyframePoint(),
                  'bone'
                ).props,
              },
            })
          ),
          {
            name: 'bone',
            props: { translateX: true, translateY: false },
          }
        )
      ).toEqual({
        name: 'bone',
        props: { translateY: true, rotate: true, scaleX: true, scaleY: true },
      })
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
      const res = target.getSamePropRangeFrameMapById({
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
      expect(target.getSamePropRangeFrameMap(list, 0).translateX).toEqual(3)
      expect(target.getSamePropRangeFrameMap(list, 1).translateX).toEqual(2)
      expect(target.getSamePropRangeFrameMap(list, 2).translateX).toEqual(0)
    })
    it('translateY', () => {
      const list = [
        getKeyframeBone({ frame: 0, points: { translateY: t1 } }),
        getKeyframeBone({ frame: 3, points: { translateY: t1 } }),
        getKeyframeBone({ frame: 5, points: { translateY: t1 } }),
        getKeyframeBone({ frame: 5, points: { translateY: t2 } }),
      ]
      expect(target.getSamePropRangeFrameMap(list, 0).translateY).toEqual(3)
      expect(target.getSamePropRangeFrameMap(list, 1).translateY).toEqual(2)
      expect(target.getSamePropRangeFrameMap(list, 2).translateY).toEqual(0)
    })
    it('rotate', () => {
      const list = [
        getKeyframeBone({ frame: 0, points: { rotate: t1 } }),
        getKeyframeBone({ frame: 3, points: { rotate: t1 } }),
        getKeyframeBone({ frame: 5, points: { rotate: t1 } }),
        getKeyframeBone({ frame: 5, points: { rotate: t2 } }),
      ]
      expect(target.getSamePropRangeFrameMap(list, 0).rotate).toEqual(3)
      expect(target.getSamePropRangeFrameMap(list, 1).rotate).toEqual(2)
      expect(target.getSamePropRangeFrameMap(list, 2).rotate).toEqual(0)
    })
    it('scaleX', () => {
      const list = [
        getKeyframeBone({ frame: 0, points: { scaleX: t1 } }),
        getKeyframeBone({ frame: 3, points: { scaleX: t1 } }),
        getKeyframeBone({ frame: 5, points: { scaleX: t1 } }),
        getKeyframeBone({ frame: 5, points: { scaleX: t2 } }),
      ]
      expect(target.getSamePropRangeFrameMap(list, 0).scaleX).toEqual(3)
      expect(target.getSamePropRangeFrameMap(list, 1).scaleX).toEqual(2)
      expect(target.getSamePropRangeFrameMap(list, 2).scaleX).toEqual(0)
    })
    it('scaleY', () => {
      const list = [
        getKeyframeBone({ frame: 0, points: { scaleY: t1 } }),
        getKeyframeBone({ frame: 3, points: { scaleY: t1 } }),
        getKeyframeBone({ frame: 5, points: { scaleY: t1 } }),
        getKeyframeBone({ frame: 5, points: { scaleY: t2 } }),
      ]
      expect(target.getSamePropRangeFrameMap(list, 0).scaleY).toEqual(3)
      expect(target.getSamePropRangeFrameMap(list, 1).scaleY).toEqual(2)
      expect(target.getSamePropRangeFrameMap(list, 2).scaleY).toEqual(0)
    })
  })

  describe('batchUpdatePoints', () => {
    it('batch update', () => {
      const keyframeMap = {
        a: getKeyframeBone({
          points: {
            translateX: getKeyframePoint({ value: 1 }),
            translateY: getKeyframePoint({ value: 1 }),
          },
        }),
      }
      const selectedStateMap = {
        a: { name: 'bone' as const, props: { translateX: true } },
      }
      const ret = target.batchUpdatePoints(
        keyframeMap,
        selectedStateMap,
        (p) => ({ ...p, value: p.value * 2 })
      )
      expect(ret).toEqual({
        a: getKeyframeBone({
          points: {
            translateX: getKeyframePoint({ value: 2 }),
            translateY: getKeyframePoint({ value: 1 }),
          },
        }),
      })
    })
  })

  describe('getKeyframe', () => {
    it('get KeyframeBone if arg.name is "bone"', () => {
      const ret = target.getKeyframe({ name: 'bone', id: 'a' })
      expect(ret.name).toBe('bone')
      expect(ret.id).toBe('a')
    })
  })

  describe('splitKeyframeMapBySelected', () => {
    fit('split points of the keyframe whether selected or unselected', () => {
      const keyframeMap = {
        a: getKeyframeBone({
          id: 'a',
          points: {
            translateX: getKeyframePoint(),
            translateY: getKeyframePoint(),
          },
        }),
      }
      const selectedKeyframeMap = {
        a: { name: 'bone', props: { translateX: true } },
      } as const
      const ret = target.splitKeyframeMapBySelected(
        keyframeMap,
        selectedKeyframeMap
      )
      expect(ret.selected).toEqual({
        a: getKeyframeBone({
          id: 'a',
          points: {
            translateX: getKeyframePoint(),
          },
        }),
      })
      expect(ret.notSelected).toEqual({
        a: getKeyframeBone({
          id: 'a',
          points: {
            translateY: getKeyframePoint(),
          },
        }),
      })
    })
  })

  describe('moveKeyframe', () => {
    it('move keyframe x => frame, y => value', () => {
      expect(
        target.moveKeyframe(
          getKeyframeBone({
            frame: 1,
            points: {
              translateX: getKeyframePoint({ value: 2 }),
            },
          }),
          { x: 10, y: 20 }
        )
      ).toEqual(
        getKeyframeBone({
          frame: 11,
          points: {
            translateX: getKeyframePoint({ value: 22 }),
          },
        })
      )
    })
  })
})
