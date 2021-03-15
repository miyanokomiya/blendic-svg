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

import { hslaToHsva, hsvaToHsla, parseHSLA, rednerHSLA } from '/@/utils/color'

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
})
