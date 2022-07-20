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

import {
  generatePathDNodes,
  alignPathDNodes,
} from '../../../src/utils/graphNodes/svgConverter'
import { createGraphNode } from '/@/utils/graphNodes'

describe('src/utils/graphNodes/svgConverter.ts', () => {
  describe('generatePathDNodes', () => {
    const commonProps = {
      data: {},
      position: { x: 0, y: 0 },
    }

    it('should make M,m nodes', () => {
      let couunt = 0
      expect(generatePathDNodes('M1 2 m1 2', () => `${couunt++}`)).toEqual([
        {
          ...commonProps,
          id: '0',
          type: 'make_path_m',
          inputs: {
            d: { value: [] },
            relative: { value: false },
            p: { value: { x: 1, y: 2 } },
          },
        },
        {
          ...commonProps,
          id: '1',
          type: 'make_path_m',
          inputs: {
            d: { from: { id: '0', key: 'd' } },
            relative: { value: true },
            p: { value: { x: 1, y: 2 } },
          },
        },
      ])
    })

    it('should make L,l nodes', () => {
      let couunt = 0
      expect(generatePathDNodes('L1 2 l1 2', () => `${couunt++}`)).toEqual([
        {
          ...commonProps,
          id: '0',
          type: 'make_path_l',
          inputs: {
            d: { value: [] },
            relative: { value: false },
            p: { value: { x: 1, y: 2 } },
          },
        },
        {
          ...commonProps,
          id: '1',
          type: 'make_path_l',
          inputs: {
            d: { from: { id: '0', key: 'd' } },
            relative: { value: true },
            p: { value: { x: 1, y: 2 } },
          },
        },
      ])
    })

    it('should make H,h nodes', () => {
      let couunt = 0
      expect(generatePathDNodes('H1 h2', () => `${couunt++}`)).toEqual([
        {
          ...commonProps,
          id: '0',
          type: 'make_path_h',
          inputs: {
            d: { value: [] },
            relative: { value: false },
            x: { value: 1 },
          },
        },
        {
          ...commonProps,
          id: '1',
          type: 'make_path_h',
          inputs: {
            d: { from: { id: '0', key: 'd' } },
            relative: { value: true },
            x: { value: 2 },
          },
        },
      ])
    })

    it('should make V,v nodes', () => {
      let couunt = 0
      expect(generatePathDNodes('V1 v2', () => `${couunt++}`)).toEqual([
        {
          ...commonProps,
          id: '0',
          type: 'make_path_v',
          inputs: {
            d: { value: [] },
            relative: { value: false },
            y: { value: 1 },
          },
        },
        {
          ...commonProps,
          id: '1',
          type: 'make_path_v',
          inputs: {
            d: { from: { id: '0', key: 'd' } },
            relative: { value: true },
            y: { value: 2 },
          },
        },
      ])
    })

    it('should make Q,q nodes', () => {
      let couunt = 0
      expect(
        generatePathDNodes('Q1 2 3 4 q1 2 3 4', () => `${couunt++}`)
      ).toEqual([
        {
          ...commonProps,
          id: '0',
          type: 'make_path_q',
          inputs: {
            d: { value: [] },
            relative: { value: false },
            c1: { value: { x: 1, y: 2 } },
            p: { value: { x: 3, y: 4 } },
          },
        },
        {
          ...commonProps,
          id: '1',
          type: 'make_path_q',
          inputs: {
            d: { from: { id: '0', key: 'd' } },
            relative: { value: true },
            c1: { value: { x: 1, y: 2 } },
            p: { value: { x: 3, y: 4 } },
          },
        },
      ])
    })

    it('should make T,t nodes', () => {
      let couunt = 0
      expect(generatePathDNodes('T1 2 t1 2', () => `${couunt++}`)).toEqual([
        {
          ...commonProps,
          id: '0',
          type: 'make_path_t',
          inputs: {
            d: { value: [] },
            relative: { value: false },
            p: { value: { x: 1, y: 2 } },
          },
        },
        {
          ...commonProps,
          id: '1',
          type: 'make_path_t',
          inputs: {
            d: { from: { id: '0', key: 'd' } },
            relative: { value: true },
            p: { value: { x: 1, y: 2 } },
          },
        },
      ])
    })

    it('should make C,c nodes', () => {
      let couunt = 0
      expect(
        generatePathDNodes('C1 2 3 4 5 6 c1 2 3 4 5 6', () => `${couunt++}`)
      ).toEqual([
        {
          ...commonProps,
          id: '0',
          type: 'make_path_c',
          inputs: {
            d: { value: [] },
            relative: { value: false },
            c1: { value: { x: 1, y: 2 } },
            c2: { value: { x: 3, y: 4 } },
            p: { value: { x: 5, y: 6 } },
          },
        },
        {
          ...commonProps,
          id: '1',
          type: 'make_path_c',
          inputs: {
            d: { from: { id: '0', key: 'd' } },
            relative: { value: true },
            c1: { value: { x: 1, y: 2 } },
            c2: { value: { x: 3, y: 4 } },
            p: { value: { x: 5, y: 6 } },
          },
        },
      ])
    })

    it('should make S,s nodes', () => {
      let couunt = 0
      expect(
        generatePathDNodes('S1 2 3 4 s1 2 3 4', () => `${couunt++}`)
      ).toEqual([
        {
          ...commonProps,
          id: '0',
          type: 'make_path_s',
          inputs: {
            d: { value: [] },
            relative: { value: false },
            c1: { value: { x: 1, y: 2 } },
            p: { value: { x: 3, y: 4 } },
          },
        },
        {
          ...commonProps,
          id: '1',
          type: 'make_path_s',
          inputs: {
            d: { from: { id: '0', key: 'd' } },
            relative: { value: true },
            c1: { value: { x: 1, y: 2 } },
            p: { value: { x: 3, y: 4 } },
          },
        },
      ])
    })

    it('should make A,a nodes', () => {
      let couunt = 0
      expect(
        generatePathDNodes('A1 2 3 0 1 5 6 a1 2 3 1 0 5 6', () => `${couunt++}`)
      ).toEqual([
        {
          ...commonProps,
          id: '0',
          type: 'make_path_a',
          inputs: {
            d: { value: [] },
            relative: { value: false },
            rx: { value: 1 },
            ry: { value: 2 },
            rotate: { value: 3 },
            'large-arc': { value: false },
            sweep: { value: true },
            p: { value: { x: 5, y: 6 } },
          },
        },
        {
          ...commonProps,
          id: '1',
          type: 'make_path_a',
          inputs: {
            d: { from: { id: '0', key: 'd' } },
            relative: { value: true },
            rx: { value: 1 },
            ry: { value: 2 },
            rotate: { value: 3 },
            'large-arc': { value: true },
            sweep: { value: false },
            p: { value: { x: 5, y: 6 } },
          },
        },
      ])
    })

    it('should make z nodes', () => {
      let couunt = 0
      expect(generatePathDNodes('Z z', () => `${couunt++}`)).toEqual([
        {
          ...commonProps,
          id: '0',
          type: 'make_path_z',
          inputs: {
            d: { value: [] },
          },
        },
        {
          ...commonProps,
          id: '1',
          type: 'make_path_z',
          inputs: {
            d: { from: { id: '0', key: 'd' } },
          },
        },
      ])
    })
  })

  describe('alignPathDNodes', () => {
    it('should align path d nodes', () => {
      expect(
        alignPathDNodes(
          [
            createGraphNode('make_path_m'),
            createGraphNode('make_path_l'),
            createGraphNode('make_path_m'),
            createGraphNode('make_path_l'),
            createGraphNode('make_path_l'),
          ],
          { x: 100, y: 200 }
        )
      ).toEqual([
        createGraphNode('make_path_m', { position: { x: 100, y: 200 } }),
        createGraphNode('make_path_l', { position: { x: 120, y: 250 } }),
        createGraphNode('make_path_m', { position: { x: 100, y: 300 } }),
        createGraphNode('make_path_l', { position: { x: 120, y: 350 } }),
        createGraphNode('make_path_l', { position: { x: 140, y: 400 } }),
      ])
    })
  })
})
