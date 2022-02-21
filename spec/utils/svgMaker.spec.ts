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

import { getElementNode } from '/@/models'
import {
  createAnimationElementStyle,
  createAnimationKeyframeItem,
  createAnimationKeyframes,
  makeSvg,
  serializeToAnimatedSvg,
} from '/@/utils/svgMaker'

describe('utils/svgMaker.ts', () => {
  describe('makeSvg', () => {
    it('make SVGElement from element node', () => {
      const ret = makeSvg(
        getElementNode({
          id: 'svg_1',
          tag: 'svg',
          attributes: {
            id: 'svg_1',
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '1 2 3 4',
          },
          children: [
            getElementNode({
              id: 'g_1',
              tag: 'g',
              attributes: {
                id: 'g_1',
              },
              children: [
                getElementNode({
                  id: 'rect_1',
                  tag: 'rect',
                  attributes: {
                    id: 'rect_1',
                  },
                  children: [],
                }),
                getElementNode({
                  id: 'text_1',
                  tag: 'text',
                  attributes: {
                    id: 'text_1',
                  },
                  children: ['message'],
                }),
              ],
            }),
          ],
        })
      )

      expect(ret.getAttribute('viewBox')).toBe('1 2 3 4')
      expect(ret.getElementsByTagName('g').length).toBe(1)
      expect(ret.getElementsByTagName('rect').length).toBe(1)
      expect(ret.getElementsByTagName('text').length).toBe(1)
    })

    it('apply id to each elements if applyId = true', () => {
      const ret = makeSvg(
        getElementNode({
          id: 'svg_1',
          tag: 'svg',
          children: [
            getElementNode({
              id: 'g_1',
              tag: 'g',
              children: [],
            }),
          ],
        }),
        true
      )

      expect(ret.id).toBe('svg_1')
      expect(ret.children[0].id).toBe('g_1')
    })
  })

  describe('serializeToAnimatedSvg', () => {
    it('should create SVG element with animation styles', () => {
      const svg = serializeToAnimatedSvg(
        getElementNode({
          id: 'svg_1',
          tag: 'svg',
          children: [
            getElementNode({
              id: 'g_1',
              tag: 'g',
              children: [],
            }),
          ],
        }),
        ['svg_1', 'g_1'],
        [
          { svg_1: { width: '0' }, g_1: { height: '0' } },
          { svg_1: { width: '100px' }, g_1: { height: '200px' } },
        ],
        2000
      )

      expect(svg).toBeInstanceOf(SVGElement)
      expect(svg.id).toBe('svg_1')
      expect(svg.getElementsByTagName('style')[0].innerHTML).toContain('#svg_1')
      expect(svg.getElementsByTagName('style')[0].innerHTML).toContain('#g_1')
    })
    it('should omit styles for elements not having keyframes', () => {
      const svg = serializeToAnimatedSvg(
        getElementNode({
          id: 'svg_1',
          tag: 'svg',
          children: [],
        }),
        ['svg_1'],
        [{ svg_1: {} }, { svg_1: {} }],
        2000
      )

      expect(svg.getElementsByTagName('style')[0].innerHTML).not.toContain(
        '#svg_1'
      )
    })
  })

  describe('createAnimationKeyframes', () => {
    it('should create animation keyframes item', () => {
      expect(
        createAnimationKeyframes('elm', [
          { width: '0' },
          { width: '10px' },
          { width: '20px' },
          { width: '30px' },
          { width: '100px' },
        ])
      ).toBe(
        '@keyframes blendic-keyframes-elm {0%{width:0;} 25%{width:10px;} 50%{width:20px;} 75%{width:30px;} 100%{width:100px;}}'
      )
    })
    it('should omit empty keyframes', () => {
      expect(
        createAnimationKeyframes('elm', [
          { width: '0' },
          {},
          { width: '20px' },
          {},
          { width: '100px' },
        ])
      ).toBe(
        '@keyframes blendic-keyframes-elm {0%{width:0;} 50%{width:20px;} 100%{width:100px;}}'
      )
    })
    it('should return empty string if no keyframe exists', () => {
      expect(createAnimationKeyframes('elm', [{}, {}])).toBe('')
    })
  })

  describe('createAnimationKeyframeItem', () => {
    it('should create animation keyframes item', () => {
      expect(createAnimationKeyframeItem({ width: '100px' }, 10)).toBe(
        '10%{width:100px;}'
      )
    })
    it('should return empty string if no attribute exists', () => {
      expect(createAnimationKeyframeItem({}, 10)).toBe('')
    })
  })

  describe('createAnimationElementStyle', () => {
    it('should create animation style for the element', () => {
      expect(createAnimationElementStyle('elm', 2000, 1)).toBe(
        '#elm{animation-name:blendic-keyframes-elm;animation-duration:2000ms;animation-iteration-count:1;}'
      )
    })
  })
})
