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

import { getTransform, getBone } from '/@/models'
import {
  apply,
  getDependentCountMap,
  getOption,
  immigrate,
} from '/@/utils/constraints/copyScale'

describe('utils/constraints/copyScale.ts', () => {
  describe('apply', () => {
    const parent = getBone({
      id: 'parent',
      transform: getTransform({ scale: { x: 1000, y: 2000 } }),
    })
    const boneMap = {
      a: getBone({
        id: 'a',
        transform: getTransform({ scale: { x: 100, y: 200 } }),
      }),
      b: getBone({
        id: 'b',
        transform: getTransform({ scale: { x: 10, y: 20 } }),
        parentId: 'parent',
      }),
      parent,
    }
    const localMap = {
      a: getBone({
        id: 'a',
        transform: getTransform({ scale: { x: 50, y: 150 } }),
      }),
      b: getBone({
        id: 'b',
        transform: getTransform({ scale: { x: 5, y: 15 } }),
        parentId: 'parent',
      }),
      parent,
    }

    it('influence: 0.5', () => {
      const ret = apply(
        'b',
        getOption({
          targetId: 'a',
          influence: 0.5,
        }),
        localMap,
        boneMap
      )
      expect(ret.b).toEqual(
        getBone({
          ...boneMap.b,
          transform: getTransform({
            scale: { x: 55, y: 110 },
          }),
        })
      )
    })

    it('power', () => {
      const ret = apply(
        'b',
        getOption({
          targetId: 'a',
          power: -0.5,
        }),
        localMap,
        boneMap
      )
      expect(ret.b).toEqual(
        getBone({
          ...boneMap.b,
          transform: getTransform({
            scale: { x: -35, y: -70 },
          }),
        })
      )
    })

    it('disabled', () => {
      const ret = apply(
        'b',
        getOption({
          targetId: 'a',
          copyX: false,
          copyY: false,
        }),
        localMap,
        boneMap
      )
      expect(ret.b).toEqual(getBone({ ...boneMap.b }))
    })

    it('target: world -> owner: world', () => {
      const ret = apply(
        'b',
        getOption({
          targetId: 'a',
        }),
        localMap,
        boneMap
      )
      expect(ret.b).toEqual(
        getBone({
          ...boneMap.b,
          transform: getTransform({
            scale: { x: 100, y: 200 },
          }),
        })
      )
    })

    it('target: world -> owner: local', () => {
      const ret = apply(
        'b',
        getOption({
          targetId: 'a',
          ownerSpaceType: 'local',
        }),
        localMap,
        boneMap
      )
      expect(ret.b).toEqual(
        getBone({
          ...boneMap.b,
          transform: getTransform({
            scale: { x: 1000 * 100, y: 2000 * 200 },
          }),
        })
      )
    })

    it('target: local -> owner: world', () => {
      const ret = apply(
        'b',
        getOption({
          targetId: 'a',
          targetSpaceType: 'local',
        }),
        localMap,
        boneMap
      )
      expect(ret.b).toEqual(
        getBone({
          ...boneMap.b,
          transform: getTransform({
            scale: { x: 50, y: 150 },
          }),
        })
      )
    })

    it('target: local -> owner: local', () => {
      const ret = apply(
        'b',
        getOption({
          targetId: 'a',
          targetSpaceType: 'local',
          ownerSpaceType: 'local',
        }),
        localMap,
        boneMap
      )
      expect(ret.b).toEqual(
        getBone({
          ...boneMap.b,
          transform: getTransform({
            scale: { x: 1000 * 50, y: 2000 * 150 },
          }),
        })
      )
    })
  })

  describe('immigrate', () => {
    it('immigrate bone ids', () => {
      expect(immigrate({ a: 'aa', b: 'bb' }, getOption())).toEqual(getOption())
      expect(
        immigrate({ a: 'aa', b: 'bb' }, getOption({ targetId: 'a' }))
      ).toEqual(getOption({ targetId: 'aa' }))
      expect(immigrate({}, getOption({ targetId: 'a' }))).toEqual(
        getOption({ targetId: 'a' })
      )
    })
  })

  describe('getDependentCountMap', () => {
    it('get dependent count map', () => {
      expect(getDependentCountMap(getOption({ targetId: 'a' }))).toEqual({
        a: 1,
      })
    })
  })
})
