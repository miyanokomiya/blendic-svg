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

import { getBone } from '/@/models'
import { apply } from '/@/utils/constraints/ik'

describe('utils/constraints/ik.ts', () => {
  describe('apply', () => {
    describe('over range', () => {
      const boneMap = {
        target: getBone({
          id: 'target',
          head: { x: 5, y: 5 },
        }),
        a: getBone({ id: 'a', head: { x: 0, y: 0 }, tail: { x: 1, y: 0 } }),
        b: getBone({
          id: 'b',
          head: { x: 1, y: 0 },
          tail: { x: 2, y: 0 },
          parentId: 'a',
          connected: true,
        }),
        c: getBone({
          id: 'c',
          head: { x: 2, y: 0 },
          tail: { x: 3, y: 0 },
          parentId: 'b',
          connected: true,
        }),
      }
      it('1 chain', () => {
        const option = {
          targetId: 'target',
          poleTargetId: '',
          iterations: 20,
          chainLength: 1,
        }
        const res = apply('a', option, boneMap)
        expect(res.a.transform.rotate).toBeCloseTo(45)
      })
      it('2 chain', () => {
        const option = {
          targetId: 'target',
          poleTargetId: '',
          iterations: 20,
          chainLength: 2,
        }
        const res = apply('b', option, boneMap)
        expect(res.a.transform.rotate).toBeCloseTo(45)
        expect(res.b.transform.rotate).toBeCloseTo(45)
      })
      it('3 chain', () => {
        const option = {
          targetId: 'target',
          poleTargetId: '',
          iterations: 20,
          chainLength: 3,
        }
        const res = apply('c', option, boneMap)
        expect(res.a.transform.rotate).toBeCloseTo(45)
        expect(res.b.transform.rotate).toBeCloseTo(45)
        expect(res.c.transform.rotate).toBeCloseTo(45)
        expect(res.a.transform.translate.x).toBeCloseTo(0)
        expect(res.a.transform.translate.y).toBeCloseTo(0)
      })
    })
    describe('in range', () => {
      const boneMap = {
        target: getBone({
          id: 'target',
          head: { x: 0.5, y: 0.5 },
        }),
        a: getBone({ id: 'a', head: { x: 0, y: 0 }, tail: { x: 1, y: 0 } }),
        b: getBone({
          id: 'b',
          head: { x: 1, y: 0 },
          tail: { x: 2, y: 0 },
          parentId: 'a',
          connected: true,
        }),
        c: getBone({
          id: 'c',
          head: { x: 2, y: 0 },
          tail: { x: 3, y: 0 },
          parentId: 'b',
          connected: true,
        }),
      }
      it('1 chain', () => {
        const option = {
          targetId: 'target',
          poleTargetId: '',
          iterations: 20,
          chainLength: 1,
        }
        const res = apply('a', option, boneMap)
        expect(res.a.transform.rotate).toBeCloseTo(45)
        expect(res.a.transform.translate.x).toBeCloseTo(0)
        expect(res.a.transform.translate.y).toBeCloseTo(0)
      })
      it('1 chain', () => {
        const option = {
          targetId: 'target',
          poleTargetId: '',
          iterations: 20,
          chainLength: 2,
        }
        const res = apply('b', option, boneMap)
        expect(res.a.transform.rotate).toBeCloseTo(-24.29491472973583)
        expect(res.b.transform.rotate).toBeCloseTo(114.2955545667173)
        expect(res.a.transform.translate.x).toBeCloseTo(0)
        expect(res.a.transform.translate.y).toBeCloseTo(0)
      })
    })
  })
})
