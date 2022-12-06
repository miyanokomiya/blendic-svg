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

import { getBElement, getBone, getElementNode, getTransform } from '/@/models'
import {
  dropColorStyles,
  getPosedAttributesWithoutTransform,
  posedHsva,
} from '/@/utils/attributesResolver'

describe('getPosedAttributesWithoutTransform', () => {
  it('no posed attributes', () => {
    const boneMap = { bone: getBone() }
    const element = getBElement()
    const node = getElementNode()
    expect(getPosedAttributesWithoutTransform(boneMap, element, node)).toEqual(
      {}
    )
  })

  it('viewBox', () => {
    const boneMap = {
      bone: getBone({
        transform: getTransform({ translate: { x: 1, y: 2 } }),
      }),
    }
    const element = getBElement({ viewBoxBoneId: 'bone' })
    const node = getElementNode({ attributes: { viewBox: '0 0 1 2' } })
    expect(getPosedAttributesWithoutTransform(boneMap, element, node)).toEqual({
      viewBox: '1 2 1 2',
    })
  })

  describe('fill', () => {
    const boneMap = {
      bone: getBone({
        transform: getTransform({
          translate: { x: 0, y: 50 },
          scale: { x: 0.2, y: 2 },
          rotate: 120,
        }),
      }),
    }
    it('hsl -> rgb text', () => {
      const element = getBElement({ fillBoneId: 'bone' })
      const node = getElementNode()
      const ret = getPosedAttributesWithoutTransform(boneMap, element, node)
      expect(ret.fill).not.toContain('hsva')
      expect(ret.fill).toContain('rgb')
      expect(ret['fill-opacity']).toBe('0.2')
    })
  })

  describe('stroke', () => {
    const boneMap = {
      bone: getBone({
        transform: getTransform({
          translate: { x: 1, y: 2 },
          scale: { x: 0.2, y: 2 },
          rotate: 90,
        }),
      }),
    }
    it('hsl -> rgb text', () => {
      const element = getBElement({ strokeBoneId: 'bone' })
      const node = getElementNode()
      const ret = getPosedAttributesWithoutTransform(boneMap, element, node)
      expect(ret.stroke).not.toContain('hsva')
      expect(ret.stroke).toContain('rgb')
      expect(ret['stroke-opacity']).toBe('0.2')
    })
  })

  describe('posedHsva', () => {
    it('bone to HSVA', () => {
      expect(
        posedHsva(
          getTransform({
            translate: { x: 10, y: 20 },
            rotate: 3,
            scale: { x: 0.5, y: 2 },
          })
        )
      ).toEqual({ h: 3, s: 0.1, v: 0.2, a: 0.5 })
    })
    it('clmap in SVA range', () => {
      expect(
        posedHsva(
          getTransform({
            translate: { x: 1000, y: -20 },
            rotate: 400,
            scale: { x: 1.5, y: 2 },
          })
        )
      ).toEqual({ h: 400, s: 1, v: 0, a: 1 })
    })
  })
})

describe('dropColorStyles', () => {
  it('should drop color styles if the element has color attributes', () => {
    expect(
      dropColorStyles({
        fill: 'blue',
        stroke: 'green',
        style: 'fill:red;stroke:red;fill-opacity:0.5;stroke-opacity:0.6;',
      })
    ).toEqual({
      fill: 'blue',
      stroke: 'green',
      style: 'fill-opacity:0.5;stroke-opacity:0.6;',
    })

    expect(
      dropColorStyles({
        'fill-opacity': '0',
        'stroke-opacity': '1',
        style: 'fill:red;stroke:red;fill-opacity:0.5;stroke-opacity:0.6;',
      })
    ).toEqual({
      'fill-opacity': '0',
      'stroke-opacity': '1',
      style: 'fill:red;stroke:red;',
    })
  })

  it('should drop style attribute if it no longer has value', () => {
    expect(
      dropColorStyles({
        fill: 'blue',
        style: 'fill:red;',
      })
    ).toEqual({ fill: 'blue' })
  })
})
