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

import { parsePathD } from '../../src/utils/svgParser'

describe('src/utils/svgParser.ts', () => {
  describe('parsePathD', () => {
    it('should parse path', () => {
      const src = [
        'M 1.1 2.2',
        'm 1 2',
        'L 1 2',
        'l 1 2',
        'H 1',
        'h 1',
        'V 1',
        'v 1',
        'Q 1 2 3 4',
        'q 1 2 3 4',
        'T 1 2',
        't 1 2',
        'C 1 2 3 4 5 6',
        'c 1 2 3 4 5 6',
        'S 1 2 3 4',
        's 1 2 3 4',
        'A 1 2 3 1 0 6 7',
        'a 1 2 3 0 1 6 7',
        'Z',
        'z',
      ].join(' ')
      expect(parsePathD(src)).toEqual([
        {
          command: 'M',
          p: { x: 1.1, y: 2.2 },
        },
        {
          command: 'm',
          p: { x: 1, y: 2 },
        },
        {
          command: 'L',
          p: { x: 1, y: 2 },
        },
        {
          command: 'l',
          p: { x: 1, y: 2 },
        },
        { command: 'H', x: 1 },
        { command: 'h', x: 1 },
        { command: 'V', y: 1 },
        { command: 'v', y: 1 },
        {
          command: 'Q',
          c1: { x: 1, y: 2 },
          p: { x: 3, y: 4 },
        },
        {
          command: 'q',
          c1: { x: 1, y: 2 },
          p: { x: 3, y: 4 },
        },
        {
          command: 'T',
          p: { x: 1, y: 2 },
        },
        {
          command: 't',
          p: { x: 1, y: 2 },
        },
        {
          command: 'C',
          c1: { x: 1, y: 2 },
          c2: { x: 3, y: 4 },
          p: { x: 5, y: 6 },
        },
        {
          command: 'c',
          c1: { x: 1, y: 2 },
          c2: { x: 3, y: 4 },
          p: { x: 5, y: 6 },
        },
        {
          command: 'S',
          c1: { x: 1, y: 2 },
          p: { x: 3, y: 4 },
        },
        {
          command: 's',
          c1: { x: 1, y: 2 },
          p: { x: 3, y: 4 },
        },
        {
          command: 'A',
          rx: 1,
          ry: 2,
          rotate: 3,
          'large-arc': true,
          sweep: false,
          p: { x: 6, y: 7 },
        },
        {
          command: 'a',
          rx: 1,
          ry: 2,
          rotate: 3,
          'large-arc': false,
          sweep: true,
          p: { x: 6, y: 7 },
        },
        { command: 'Z' },
        { command: 'z' },
      ])
    })
    it('should throw if the command is invalid', () => {
      expect(() => parsePathD('M 1')).toThrow()
      expect(() => parsePathD('c 1 2 3 4 5')).toThrow()
      expect(() => parsePathD('Y 1 2')).toThrow()
    })
  })
})
