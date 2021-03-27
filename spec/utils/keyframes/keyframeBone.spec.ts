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
import { getKeyframeBone } from '/@/models/keyframe'
import * as target from '/@/utils/keyframes/keyframeBone'

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
})
