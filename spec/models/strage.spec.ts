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
  getAction,
  getActor,
  getArmature,
  getBElement,
  getBone,
  getKeyframe,
} from '/@/models'
import { initialize, StrageRoot } from '/@/models/strage'

describe('src/models/strage.ts', () => {
  describe('initialize', () => {
    it('init migrated properties', () => {
      const src = {
        armatures: [
          {
            id: 'arm',
            bones: [{ id: 'bone' }],
          },
        ],
        actions: [
          {
            id: 'act',
            keyframes: [
              {
                id: 'key',
              },
            ],
          },
        ],
        actors: [
          {
            id: 'actor',
            elements: [{ id: 'elm' }],
          },
        ],
      }
      expect(initialize(src as any)).toEqual({
        armatures: [
          getArmature({
            id: 'arm',
            bones: [getBone({ id: 'bone' })],
          }),
        ],
        actions: [
          getAction({
            id: 'act',
            keyframes: [
              getKeyframe({
                id: 'key',
              }),
            ],
          }),
        ],
        actors: [
          getActor({
            id: 'actor',
            elements: [getBElement({ id: 'elm' })],
          }),
        ],
      })
    })
  })
})
