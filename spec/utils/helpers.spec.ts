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

import { getBone, getTransform } from '/@/models'
import { getConstraint } from '/@/utils/constraints'
import {
  parseStyle,
  toStyle,
  getTnansformStr,
  normalizeAttributes,
  getKeyframeBoneSummary,
  getKeyframeConstraintSummary,
  getTargetTopMap,
} from '/@/utils/helpers'

describe('utils/helpers.ts', () => {
  describe('transform', () => {
    it('get empty text if identity', () => {
      expect(getTnansformStr(getTransform({}))).toBe('')
    })
    it('get translate text', () => {
      expect(
        getTnansformStr(
          getTransform({
            translate: { x: 1, y: 2 },
          })
        )
      ).toBe('translate(1,2)')
    })
    it('get scale text', () => {
      expect(
        getTnansformStr(
          getTransform({
            scale: { x: 10, y: 20 },
            origin: { x: 1, y: 2 },
          })
        )
      ).toBe('translate(1,2) scale(10,20) translate(-1,-2)')
    })
    it('get rotate text', () => {
      expect(
        getTnansformStr(
          getTransform({
            rotate: 10,
            origin: { x: 1, y: 2 },
          })
        )
      ).toBe('rotate(10 1 2)')
    })
    it('get multiple transform text', () => {
      expect(
        getTnansformStr(
          getTransform({
            translate: { x: 1, y: 2 },
            scale: { x: 10, y: 20 },
            rotate: 10,
            origin: { x: 1, y: 2 },
          })
        )
      ).toBe(
        [
          getTnansformStr(
            getTransform({
              translate: { x: 1, y: 2 },
            })
          ),
          getTnansformStr(
            getTransform({
              scale: { x: 10, y: 20 },
              origin: { x: 1, y: 2 },
            })
          ),
          getTnansformStr(
            getTransform({
              rotate: 10,
              origin: { x: 1, y: 2 },
            })
          ),
        ].join(' ')
      )
    })
  })

  describe('parseStyle', () => {
    it('parse style text to the map', () => {
      expect(parseStyle('fill:red; stroke: green;')).toEqual({
        fill: 'red',
        stroke: 'green',
      })
      expect(parseStyle(' fill : red ; stroke: green ')).toEqual({
        fill: 'red',
        stroke: 'green',
      })
    })
  })

  describe('toStyle', () => {
    it('convert to the style text', () => {
      expect(
        toStyle({
          fill: 'red',
          stroke: 'green',
        })
      ).toEqual('fill:red;stroke:green;')
    })
  })

  describe('normalizeAttributes', () => {
    it('drop styles duplicated with attributes', () => {
      expect(
        normalizeAttributes({
          style: 'fill:black;opacity:0.1;stroke:black;',
          fill: 'red',
          stroke: 'green',
        })
      ).toEqual({
        style: 'opacity:0.1;',
        fill: 'red',
        stroke: 'green',
      })
    })
  })

  describe('getKeyframeBoneSummary', () => {
    it('should return a bone summary', () => {
      expect(getKeyframeBoneSummary(getBone({ id: 'a', name: 'b' }))).toEqual({
        id: 'a',
        name: 'b',
        children: {
          translateX: 0,
          translateY: 1,
          rotate: 2,
          scaleX: 3,
          scaleY: 4,
        },
      })
    })
  })

  describe('getKeyframeConstraintSummary', () => {
    it('should return a bone summary', () => {
      expect(
        getKeyframeConstraintSummary(
          getBone({ id: 'a', name: 'b' }),
          getConstraint({
            id: 'aa',
            name: 'bb',
            type: 'IK',
          })
        )
      ).toEqual({
        id: 'aa',
        name: 'b:bb',
        children: {
          influence: 0,
        },
      })
    })
  })

  describe('getTargetTopMap', () => {
    it('should return top map of targets', () => {
      expect(
        getTargetTopMap(
          [
            {
              id: 'a',
              name: 'aa',
              children: { aaa: 0 },
            },
            {
              id: 'b',
              name: 'bb',
              children: { bbb: 0, a: 1 },
            },
            {
              id: 'c',
              name: 'cc',
              children: { ccc: 0 },
            },
          ],
          { b: true },
          10
        )
      ).toEqual({
        a: 0,
        b: 10,
        c: 40,
      })
    })
    it('should consiger padding', () => {
      expect(
        getTargetTopMap(
          [
            {
              id: 'a',
              name: 'aa',
              children: { aaa: 0 },
            },
          ],
          { a: true },
          10,
          2
        )
      ).toEqual({
        a: 20,
      })
    })
  })
})
