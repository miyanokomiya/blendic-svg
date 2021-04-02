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
import { getCurve, getKeyframePoint } from '/@/models/keyframe'
import { migrateKeyframe } from '/@/utils/migrations'

describe('src/utils/migrations.ts', () => {
  describe('migrateKeyframe', () => {
    it('v1: migrate to KeyframeBone', () => {
      const old = {
        id: '1',
        frame: 2,
        boneId: 'b',
        transform: getTransform({
          translate: { x: 1, y: 2 },
          rotate: 3,
          scale: { x: 4, y: 5 },
        }),
      }
      const ret = migrateKeyframe(old)
      expect(ret).toEqual({
        id: '1',
        frame: 2,
        targetId: 'b',
        name: 'bone',
        points: {
          translateX: getKeyframePoint({ value: 1 }),
          translateY: getKeyframePoint({ value: 2 }),
          rotate: getKeyframePoint({ value: 3 }),
          scaleX: getKeyframePoint({ value: 4 }),
          scaleY: getKeyframePoint({ value: 5 }),
        },
      })
    })
    it('v2: migrate to KeyframeBone', () => {
      const old = {
        id: '1',
        frame: 2,
        boneId: 'b',
        translateX: getKeyframePoint({ value: 1 }),
        translateY: getKeyframePoint({ value: 2 }),
        rotate: getKeyframePoint({ value: 3 }),
        scaleX: getKeyframePoint({ value: 4 }),
        scaleY: getKeyframePoint({ value: 5 }),
      }
      const ret = migrateKeyframe(old)
      expect(ret).toEqual({
        id: '1',
        frame: 2,
        targetId: 'b',
        name: 'bone',
        points: {
          translateX: getKeyframePoint({ value: 1 }),
          translateY: getKeyframePoint({ value: 2 }),
          rotate: getKeyframePoint({ value: 3 }),
          scaleX: getKeyframePoint({ value: 4 }),
          scaleY: getKeyframePoint({ value: 5 }),
        },
      })
    })
    it('v3: migrate curves', () => {
      const old = {
        id: '1',
        frame: 2,
        boneId: 'b',
        translateX: getKeyframePoint({
          value: 1,
          curve: { name: 'bezier3', c1: { x: 0, y: 1 } } as any,
        }),
      }
      const ret = migrateKeyframe(old)
      expect(ret).toEqual({
        id: '1',
        frame: 2,
        targetId: 'b',
        name: 'bone',
        points: {
          translateX: getKeyframePoint({
            value: 1,
            curve: getCurve('bezier3'),
          }),
        },
      })
    })
  })
})
