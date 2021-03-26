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

import * as target from '/@/utils/keyframes'
import * as keyframeBoneModule from '/@/utils/keyframes/keyframeBone'

describe('utils/keyframes/index.ts', () => {
  describe('getKeyframeModule', () => {
    it('get keyframeBoneModule', () => {
      const ret = target.getKeyframeModule()
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
        target.inversedSelectedState(target.getAllSelectedState(), {
          name: 'bone',
          props: { translateX: true, translateY: false },
        })
      ).toEqual({
        name: 'bone',
        props: { translateY: true, rotate: true, scaleX: true, scaleY: true },
      })
    })
  })
})
