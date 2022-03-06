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
import { getKeyframePoint } from '/@/models/keyframe'
import { getConstraint } from '/@/utils/constraints'
import { createGraphNode, getGraphNodeModule } from '/@/utils/graphNodes'
import {
  parseStyle,
  toStyle,
  getTnansformStr,
  normalizeAttributes,
  getKeyframeBoneSummary,
  getKeyframeConstraintSummary,
  getTargetTopMap,
  getGraphNodeRect,
  truncate,
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
    it('should override styles including the attributes', () => {
      const ret = normalizeAttributes({
        style: 'fill:black;opacity:0.1;stroke:black;',
        fill: 'red',
        stroke: 'green',
      })
      expect(ret).toEqual({
        style: expect.anything(),
        fill: 'red',
        stroke: 'green',
      })
      expect(parseStyle(ret.style)).toEqual({
        fill: 'red',
        stroke: 'green',
        opacity: '0.1',
      })
    })
  })

  describe('getKeyframeBoneSummary', () => {
    it('should return a bone summary with children having keyframes', () => {
      expect(
        getKeyframeBoneSummary(getBone({ id: 'a', name: 'b' }), {
          translateX: getKeyframePoint(),
          rotate: getKeyframePoint(),
        })
      ).toEqual({
        id: 'a',
        name: 'b',
        children: {
          translateX: 0,
          rotate: 1,
        },
      })
    })
    it('should return a bone summary with empty children if the keyframe does not exist', () => {
      expect(getKeyframeBoneSummary(getBone({ id: 'a', name: 'b' }))).toEqual({
        id: 'a',
        name: 'b',
        children: {},
      })
    })
  })

  describe('getKeyframeConstraintSummary', () => {
    it('should return a bone summary with children having keyframes', () => {
      expect(
        getKeyframeConstraintSummary(
          getBone({ id: 'a', name: 'b' }),
          getConstraint({
            id: 'aa',
            name: 'bb',
            type: 'IK',
          }),
          {
            influence: getKeyframePoint(),
          }
        )
      ).toEqual({
        id: 'aa',
        name: 'b:bb',
        children: {
          influence: 0,
        },
      })
    })
    it('should return a bone summary with empty children if the keyframe does not exist', () => {
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
        children: {},
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

  describe('getGraphNodeRect', () => {
    it('should return a rect of the node', () => {
      expect(
        getGraphNodeRect(
          getGraphNodeModule,
          createGraphNode('make_vector2', { position: { x: 1, y: 2 } })
        )
      ).toEqual({ x: 1, y: 2, width: 140, height: 106 })
    })
  })

  describe('truncate', () => {
    it('should return truncated text', () => {
      expect(truncate('12', 3)).toBe('12')
      expect(truncate('123', 3)).toBe('123')
      expect(truncate('1234', 3)).toBe('123..')
    })
  })
})
