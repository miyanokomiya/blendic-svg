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

import {
  getCurve,
  getKeyframeConstraint,
  getKeyframePoint,
} from '/@/models/keyframe'
import { getConstraint } from '/@/utils/constraints'
import * as target from '/@/utils/keyframes/keyframeConstraint'

describe('utils/keyframes/keyframeConstraint.ts', () => {
  describe('interpolateKeyframe', () => {
    it('influence', () => {
      expect(
        target.interpolateKeyframe(
          [
            getKeyframeConstraint({
              frame: 0,
              points: {
                influence: { value: 10, curve: getCurve('linear') },
              },
            }),
            getKeyframeConstraint({
              frame: 1,
              points: {
                influence: { value: 100, curve: getCurve('linear') },
              },
            }),
            getKeyframeConstraint({
              frame: 2,
            }),
            getKeyframeConstraint({
              frame: 4,
            }),
            getKeyframeConstraint({
              frame: 5,
              points: {
                influence: { value: 1000, curve: getCurve('linear') },
              },
            }),
          ],
          3
        )
      ).toEqual({ influence: 550 })
    })
  })

  describe('makeKeyframe', () => {
    it('should return a keyframe', () => {
      expect(
        target.makeKeyframe(
          1,
          'a',
          getConstraint({ type: 'IK', option: { influence: 10 } }),
          {
            influence: true,
          }
        )
      ).toEqual(
        getKeyframeConstraint({
          frame: 1,
          targetId: 'a',
          points: { influence: getKeyframePoint({ value: 10 }) },
        })
      )
    })
  })
})
