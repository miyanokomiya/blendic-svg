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
import {
  parseStyle,
  toStyle,
  getTnansformStr,
  normalizeAttributes,
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
})
