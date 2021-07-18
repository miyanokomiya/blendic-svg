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
  addColor,
  hslaToHsva,
  hsvaToHsla,
  hsvaToRgba,
  hsvaToTransform,
  parseHSLA,
  parseHSVA,
  parseRGBA,
  rednerHSLA,
  rednerHSVA,
  rednerRGBA,
  rgbaToHsva,
} from '/@/utils/color'

describe('src/utils/color.ts', () => {
  describe('parseHSLA', () => {
    it('string -> HSLA', () => {
      expect(parseHSLA('hsla(1, 10%,20% , 0.3  )')).toEqual({
        h: 1,
        s: 0.1,
        l: 0.2,
        a: 0.3,
      })
    })
    it('clamp in range', () => {
      expect(parseHSLA('hsla(-10, 110%,-20% , 1.3  )')).toEqual({
        h: 0,
        s: 1,
        l: 0,
        a: 1,
      })
    })
  })

  describe('parseHSVA', () => {
    it('string -> HSVA', () => {
      expect(parseHSVA('hsva(1, 10%,20% , 0.3  )')).toEqual({
        h: 1,
        s: 0.1,
        v: 0.2,
        a: 0.3,
      })
    })
    it('clamp in range', () => {
      expect(parseHSVA('hsva(-10, 110%,-20% , 1.3  )')).toEqual({
        h: 0,
        s: 1,
        v: 0,
        a: 1,
      })
    })
  })

  describe('parseRGBA', () => {
    it('string -> RGBA', () => {
      expect(parseRGBA('rgba(10, 111,234 , 0.3  )')).toEqual({
        r: 10,
        g: 111,
        b: 234,
        a: 0.3,
      })
    })
    it('clamp in range', () => {
      expect(parseRGBA('rgba(-10, 310,-20 , 1.3  )')).toEqual({
        r: 0,
        g: 255,
        b: 0,
        a: 1,
      })
    })
  })

  describe('rednerHSLA', () => {
    it('HSLA -> string', () => {
      expect(
        rednerHSLA({
          h: 1,
          s: 0.1,
          l: 0.2,
          a: 0.3,
        })
      ).toEqual('hsla(1,10%,20%,0.3)')
    })
  })

  describe('rednerHSVA', () => {
    it('HSVA -> string', () => {
      expect(
        rednerHSVA({
          h: 1,
          s: 0.1,
          v: 0.2,
          a: 0.3,
        })
      ).toEqual('hsva(1,10%,20%,0.3)')
    })
  })

  describe('rednerRGBA', () => {
    it('RGBA -> string', () => {
      expect(
        rednerRGBA({
          r: 1,
          g: 4,
          b: 6,
          a: 0.3,
        })
      ).toEqual('rgba(1,4,6,0.3)')
    })
  })

  describe('rgbaToHsva', () => {
    it('rgba -> hsva', () => {
      expect(rgbaToHsva({ r: 255, g: 0, b: 0, a: 0.9 })).toEqual({
        h: 0,
        s: 1,
        v: 1,
        a: 0.9,
      })
      expect(rgbaToHsva({ r: 0, g: 127.5, b: 0, a: 0.9 })).toEqual({
        h: 120,
        s: 1,
        v: 0.5,
        a: 0.9,
      })
    })
  })

  describe('hsvaToRgba', () => {
    it('hsva -> rgba', () => {
      expect(hsvaToRgba({ h: 0, s: 1, v: 1, a: 0.9 })).toEqual({
        r: 255,
        g: 0,
        b: 0,
        a: 0.9,
      })
      expect(hsvaToRgba({ h: 120, s: 1, v: 0.5, a: 0.9 })).toEqual({
        r: 0,
        g: 127.5,
        b: 0,
        a: 0.9,
      })
    })
    it('should clump hue circulary', () => {
      expect(hsvaToRgba({ h: -360, s: 1, v: 1, a: 1 })).toEqual({
        r: 255,
        g: 0,
        b: 0,
        a: 1,
      })
      expect(hsvaToRgba({ h: 720, s: 1, v: 1, a: 1 })).toEqual({
        r: 255,
        g: 0,
        b: 0,
        a: 1,
      })
    })
  })

  describe('hslaToHsva', () => {
    it('to hsva', () => {
      expect(
        hslaToHsva({
          h: 20,
          s: 1,
          l: 0.5,
          a: 0.9,
        })
      ).toEqual({
        h: 20,
        s: 1,
        v: 1,
        a: 0.9,
      })
    })
  })

  describe('hsvaToHsla', () => {
    it('to hsla', () => {
      expect(
        hsvaToHsla({
          h: 20,
          s: 1,
          v: 1,
          a: 0.9,
        })
      ).toEqual({
        h: 20,
        s: 1,
        l: 0.5,
        a: 0.9,
      })
    })
  })

  describe('hsvaToTransform', () => {
    it('to transform', () => {
      expect(
        hsvaToTransform({
          h: 20,
          s: 1,
          v: 1,
          a: 0.9,
        })
      ).toEqual(
        getTransform({
          translate: { x: 100, y: 100 },
          rotate: 20,
          scale: { x: 0.9, y: 1 },
        })
      )
    })
  })

  describe('addColor', () => {
    it('should add two colors', () => {
      expect(
        addColor(
          getTransform({
            translate: { x: 1, y: 2 },
            rotate: 3,
            scale: { x: 4, y: 1 },
          }),
          getTransform({
            translate: { x: 10, y: 20 },
            rotate: 30,
            scale: { x: 40, y: 1 },
          })
        )
      ).toEqual(
        getTransform({
          translate: { x: 11, y: 22 },
          rotate: 33,
          scale: { x: 44, y: 1 },
        })
      )
    })
  })
})
