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
import { getPosedAttributesWithoutTransform } from '/@/utils/attributesResolver'

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
          translate: { x: 1, y: 2 },
          scale: { x: 0.2, y: 2 },
          rotate: 90,
        }),
      }),
    }
    it('rgb', () => {
      const element = getBElement({ fillBoneId: 'bone', fillType: 'rgb' })
      const node = getElementNode()
      expect(
        getPosedAttributesWithoutTransform(boneMap, element, node)
      ).toEqual({ fill: 'rgba(1,2,90,0.2)' })
    })
    it('default: hsl', () => {
      const element = getBElement({ fillBoneId: 'bone' })
      const node = getElementNode()
      expect(
        getPosedAttributesWithoutTransform(boneMap, element, node)
      ).toEqual({ fill: 'hsla(90,1%,2%,0.2)' })
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
    it('rgb', () => {
      const element = getBElement({ strokeBoneId: 'bone', strokeType: 'rgb' })
      const node = getElementNode()
      expect(
        getPosedAttributesWithoutTransform(boneMap, element, node)
      ).toEqual({ stroke: 'rgba(1,2,90,0.2)' })
    })
    it('default: hsl', () => {
      const element = getBElement({ strokeBoneId: 'bone' })
      const node = getElementNode()
      expect(
        getPosedAttributesWithoutTransform(boneMap, element, node)
      ).toEqual({ stroke: 'hsla(90,1%,2%,0.2)' })
    })
  })
})
