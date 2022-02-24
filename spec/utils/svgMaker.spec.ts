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
  createAnimationTagsForElement,
  makeSvg,
  mergeSvgTreeList,
  mergeTwoElement,
  serializeToAnimatedSvg,
  completeEdgeAttrs,
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
    it('should create SVG animate tags', () => {
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
        [
          { svg_1: { width: '0', offset: 'mock' }, g_1: { offset: '0' } },
          { svg_1: { width: '100px' }, g_1: { offset: '1' } },
        ],
        2000
      )

      expect(svg).toBeInstanceOf(SVGElement)
      expect(svg.id).toBe('svg_1')
      const animateG = svg.getElementsByClassName('blendic-anim-group')[0]
      expect(animateG).toBeTruthy()
      expect(animateG.innerHTML).toContain('#svg_1')
      expect(animateG.innerHTML).not.toContain('width')
      expect(animateG.innerHTML).toContain('#g_1')
      expect(animateG.innerHTML).toContain('offset')
    })

    it('should create animation styles', () => {
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
        [
          { svg_1: { offset: '0' }, g_1: { transform: 'm(1,0,0,1,0,0)' } },
          { svg_1: { offset: '1' }, g_1: { transform: 'm(2,0,0,1,0,0)' } },
        ],
        2000
      )

      expect(svg).toBeInstanceOf(SVGElement)
      expect(svg.id).toBe('svg_1')
      const style = svg.getElementsByTagName('style')[0]
      expect(style.innerHTML).not.toContain('#svg_1')
      expect(style.innerHTML).not.toContain('offset')
      expect(style.innerHTML).toContain('#g_1')
      expect(style.innerHTML).toContain('transform')
    })

    it('should translate viewBox to transform', () => {
      const svg = serializeToAnimatedSvg(
        getElementNode({
          id: 'svg_1',
          tag: 'svg',
          attributes: { viewBox: '0 0 100 100' },
          children: [
            getElementNode({
              id: 'g_1',
              tag: 'g',
              children: [],
            }),
          ],
        }),
        [
          { svg_1: { viewBox: '0 0 100 100' } },
          { svg_1: { viewBox: '0 0 50 50' } },
        ],
        2000
      )

      expect(svg).toBeInstanceOf(SVGElement)
      expect(svg.children[0].id).not.toBe('g_1')
      expect(svg.children[0].children[0].id).toBe('g_1')
      const style = svg.getElementsByTagName('style')[0]
      expect(style.innerHTML).toContain('matrix(2,0,0,2,0,0)')
      const animateG = svg.getElementsByClassName('blendic-anim-group')[0]
      expect(animateG.innerHTML).not.toContain('viewBox')
    })
  })

  describe('createAnimationKeyframes', () => {
    it('should create animation keyframes item', () => {
      expect(
        createAnimationKeyframes('elm', [
          { transform: '0' },
          { transform: '10px' },
          { transform: '20px' },
          { transform: '30px' },
          { transform: '100px' },
        ])
      ).toBe(
        '@keyframes blendic-keyframes-elm {0%{transform:0;} 25%{transform:10px;} 50%{transform:20px;} 75%{transform:30px;} 100%{transform:100px;}}'
      )
    })
    it('should complete edge keyframes if they are omitted', () => {
      expect(
        createAnimationKeyframes('elm', [
          {},
          {},
          { transform: '20px' },
          { transform: '30px' },
          {},
          {},
        ])
      ).toBe(
        '@keyframes blendic-keyframes-elm {0%{transform:20px;} 40%{transform:20px;} 60%{transform:30px;} 100%{transform:30px;}}'
      )
    })
    it('should omit empty keyframes except for edges', () => {
      expect(
        createAnimationKeyframes('elm', [
          { transform: '0' },
          {},
          { transform: '20px' },
          {},
          { transform: '100px' },
        ])
      ).toBe(
        '@keyframes blendic-keyframes-elm {0%{transform:0;} 50%{transform:20px;} 100%{transform:100px;}}'
      )
    })
    it('should return empty string if no keyframe exists', () => {
      expect(createAnimationKeyframes('elm', [])).toBe('')
      expect(createAnimationKeyframes('elm', [undefined])).toBe('')
      expect(createAnimationKeyframes('elm', [undefined, undefined])).toBe('')
      expect(createAnimationKeyframes('elm', [{}, undefined, {}])).toBe('')
    })
  })

  describe('completeEdgeAttrs', () => {
    it('should complete edge attributes', () => {
      expect(
        completeEdgeAttrs([undefined, { x: '1' }, { y: '2' }, undefined])
      ).toEqual([
        { x: '1', y: '2' },
        { x: '1' },
        { y: '2' },
        { x: '1', y: '2' },
      ])
    })
  })

  describe('createAnimationKeyframeItem', () => {
    it('should create animation keyframes item', () => {
      expect(createAnimationKeyframeItem({ transform: '100px' }, 10)).toBe(
        '10%{transform:100px;}'
      )
    })
    it('should return empty string if no attribute exists', () => {
      expect(createAnimationKeyframeItem({}, 10)).toBe('')
      expect(createAnimationKeyframeItem(undefined, 10)).toBe('')
    })
    it('should ignore invalid attributes', () => {
      expect(createAnimationKeyframeItem({ id: 'abc' }, 10)).toBe('')
    })
  })

  describe('createAnimationElementStyle', () => {
    it('should create animation style for the element', () => {
      expect(createAnimationElementStyle('elm', 2000, 1)).toBe(
        '#elm{animation-name:blendic-keyframes-elm;animation-duration:2000ms;animation-iteration-count:1;}'
      )
    })
  })

  describe('createAnimationTagsForElement', () => {
    it('should return empty text if no attributes have animation', () => {
      expect(createAnimationTagsForElement('elm', [{}, {}], 1000)).toBe('')
    })
    it('should create SVG animate tag', () => {
      expect(
        createAnimationTagsForElement(
          'elm',
          [
            { d: 'M0,0' },
            { d: 'M0,1' },
            { d: 'M0,2' },
            { d: 'M0,3' },
            { d: 'M0,4' },
          ],
          1000
        )
      ).toBe(
        `<animate ${[
          `repeatCount="indefinite"`,
          `dur="1s"`,
          `href="#elm"`,
          `xlink:href="#elm"`,
          `attributeName="d"`,
          `keyTimes="0;0.25;0.5;0.75;1"`,
          `values="M0,0;M0,1;M0,2;M0,3;M0,4"`,
        ].join(' ')}/>`
      )
    })
    it('should create multiple animate tags', () => {
      expect(
        createAnimationTagsForElement(
          'elm',
          [
            { d: 'M0,0', offset: '10' },
            { d: 'M0,4', offset: '20' },
          ],
          1000
        )
      ).toBe(
        `<animate ${[
          `repeatCount="indefinite"`,
          `dur="1s"`,
          `href="#elm"`,
          `xlink:href="#elm"`,
          `attributeName="d"`,
          `keyTimes="0;1"`,
          `values="M0,0;M0,4"`,
        ].join(' ')}/><animate ${[
          `repeatCount="indefinite"`,
          `dur="1s"`,
          `href="#elm"`,
          `xlink:href="#elm"`,
          `attributeName="offset"`,
          `keyTimes="0;1"`,
          `values="10;20"`,
        ].join(' ')}/>`
      )
    })
  })

  describe('mergeSvgTreeList', () => {
    const getE = getElementNode

    it('should return undefined if the list is empty', () => {
      expect(mergeSvgTreeList([])).toEqual(undefined)
    })
    it('should merge all trees', () => {
      expect(
        mergeSvgTreeList([
          getE({
            children: [getE({ id: '0' })],
          }),
          getE({
            children: [getE({ id: '1' })],
          }),
        ])
      ).toEqual(
        getE({
          children: [getE({ id: '0' }), getE({ id: '1' })],
        })
      )
    })
  })

  describe('mergeTwoElement', () => {
    const getE = getElementNode

    it('should apply first element properties expect for children', () => {
      const a = getE({
        id: 'a',
        tag: 'rect',
        attributes: { class: 'class_a' },
      })
      expect(mergeTwoElement(a, getE())).toEqual(a)
    })
    describe('should merge children of both elements', () => {
      it('case: a has unique children', () => {
        expect(
          mergeTwoElement(
            getE({
              children: [
                getE({ id: 'a_b_0' }),
                getE({ id: 'a_0' }),
                getE({ id: 'a_b_1' }),
                getE({ id: 'a_1' }),
              ],
            }),
            getE({
              children: [getE({ id: 'a_b_0' }), getE({ id: 'a_b_1' })],
            })
          )
        ).toEqual(
          getE({
            children: [
              getE({ id: 'a_b_0' }),
              getE({ id: 'a_0' }),
              getE({ id: 'a_b_1' }),
              getE({ id: 'a_1' }),
            ],
          })
        )
      })
      it('case: b has unique children', () => {
        expect(
          mergeTwoElement(
            getE({
              children: [getE({ id: 'a_b_0' }), getE({ id: 'a_b_1' })],
            }),
            getE({
              children: [
                getE({ id: 'a_b_0' }),
                getE({ id: 'b_0' }),
                getE({ id: 'a_b_1' }),
                getE({ id: 'b_1' }),
              ],
            })
          )
        ).toEqual(
          getE({
            children: [
              getE({ id: 'a_b_0' }),
              getE({ id: 'b_0' }),
              getE({ id: 'a_b_1' }),
              getE({ id: 'b_1' }),
            ],
          })
        )
      })
      it('case: a and b have no children', () => {
        expect(
          mergeTwoElement(getE({ children: [] }), getE({ children: [] }))
        ).toEqual(getE({ children: [] }))
      })
      it('case: a has no children', () => {
        expect(
          mergeTwoElement(
            getE({ children: [] }),
            getE({
              children: [getE({ id: 'b_0' }), getE({ id: 'b_1' })],
            })
          )
        ).toEqual(
          getE({
            children: [getE({ id: 'b_0' }), getE({ id: 'b_1' })],
          })
        )
      })
      it('case: b has no children', () => {
        expect(
          mergeTwoElement(
            getE({
              children: [getE({ id: 'a_0' }), getE({ id: 'a_1' })],
            }),
            getE({ children: [] })
          )
        ).toEqual(
          getE({
            children: [getE({ id: 'a_0' }), getE({ id: 'a_1' })],
          })
        )
      })
    })

    describe('should merge and show only head SVG if showOnlyHead = true', () => {
      it('case: b has unique children', () => {
        expect(
          mergeTwoElement(
            getE({
              children: [getE({ id: 'a_b_0' }), getE({ id: 'a_b_1' })],
            }),
            getE({
              children: [
                getE({ id: 'a_b_0' }),
                getE({ id: 'b_0' }),
                getE({ id: 'a_b_1' }),
                getE({ id: 'b_1' }),
              ],
            }),
            true
          )
        ).toEqual(
          getE({
            children: [
              getE({ id: 'a_b_0' }),
              getE({ id: 'b_0', attributes: { fill: 'none', stroke: 'none' } }),
              getE({ id: 'a_b_1' }),
              getE({ id: 'b_1', attributes: { fill: 'none', stroke: 'none' } }),
            ],
          })
        )
      })
    })

    describe('when some children are plain text', () => {
      it('should pick text children in a', () => {
        expect(
          mergeTwoElement(
            getE({
              children: [
                getE({ id: 'a_b_0' }),
                'a_0',
                getE({ id: 'a_b_1' }),
                'a_1',
              ],
            }),
            getE({
              children: [getE({ id: 'a_b_0' }), getE({ id: 'a_b_1' })],
            })
          )
        ).toEqual(
          getE({
            children: [
              getE({ id: 'a_b_0' }),
              'a_0',
              getE({ id: 'a_b_1' }),
              'a_1',
            ],
          })
        )
      })
      it('should ignore text children in b', () => {
        expect(
          mergeTwoElement(
            getE({
              children: [getE({ id: 'a_b_0' }), getE({ id: 'a_b_1' })],
            }),
            getE({
              children: [
                getE({ id: 'a_b_0' }),
                'b_0',
                getE({ id: 'a_b_1' }),
                'b_1',
              ],
            })
          )
        ).toEqual(
          getE({
            children: [getE({ id: 'a_b_0' }), getE({ id: 'a_b_1' })],
          })
        )
      })
    })

    describe('should merge recursively', () => {
      it('case: both of them have children', () => {
        expect(
          mergeTwoElement(
            getE({
              children: [
                getE({ id: 'a_b_0', children: [getE({ id: 'c_0' })] }),
                getE({ id: 'a_0' }),
              ],
            }),
            getE({
              children: [
                getE({ id: 'a_b_0', children: [getE({ id: 'c_1' })] }),
              ],
            })
          )
        ).toEqual(
          getE({
            children: [
              getE({
                id: 'a_b_0',
                children: [getE({ id: 'c_0' }), getE({ id: 'c_1' })],
              }),
              getE({ id: 'a_0' }),
            ],
          })
        )
      })
    })
  })
})
