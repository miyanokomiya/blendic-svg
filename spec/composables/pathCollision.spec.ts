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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { usePathCollision } from '/@/composables/pathCollision'

describe('src/composables/pathCollision.ts', () => {
  describe('usePathCollision', () => {
    describe('should return hit path map', () => {
      it('case: straight segments', () => {
        const target = usePathCollision({
          a: 'M0,0 L10,0',
          b: 'M0,0 L0,10',
        })

        expect(
          target.getHitPathMap([
            { x: 5, y: -5 },
            { x: 5, y: 5 },
          ])
        ).toEqual({ a: true })

        expect(
          target.getHitPathMap([
            { x: -5, y: 5 },
            { x: 5, y: 5 },
          ])
        ).toEqual({ b: true })
      })
      it('case: polyline', () => {
        const target = usePathCollision({
          a: 'M0,0 L10,0 L10,10 L0,10',
        })

        expect(
          target.getHitPathMap([
            { x: 5, y: -5 },
            { x: 5, y: 5 },
          ])
        ).toEqual({ a: true })

        expect(
          target.getHitPathMap([
            { x: -5, y: 5 },
            { x: 5, y: 5 },
          ])
        ).toEqual({})
      })
      it('case: quadlic curve', () => {
        const target = usePathCollision({
          a: 'M0,0 Q5,10 10,0',
        })

        expect(
          target.getHitPathMap([
            { x: 5, y: -5 },
            { x: 5, y: 3 },
          ])
        ).toEqual({})
        expect(
          target.getHitPathMap([
            { x: 5, y: -5 },
            { x: 5, y: 8 },
          ])
        ).toEqual({ a: true })
      })
      it('case: cublic curve', () => {
        const target = usePathCollision({
          a: 'M0,0 C2.5,5 7.5,-5 10,0',
        })

        expect(
          target.getHitPathMap([
            { x: 2, y: 0 },
            { x: 3, y: 0 },
          ])
        ).toEqual({})
        expect(
          target.getHitPathMap([
            { x: 4, y: 0 },
            { x: 6, y: 0 },
          ])
        ).toEqual({ a: true })
      })
    })
  })
})
