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

import {
  getActor,
  getArmature,
  getBElement,
  getBone,
  getElementNode,
} from '/@/models'
import {
  cleanActors,
  flatElementTree,
  inheritWeight,
  parseFromSvg,
} from '/@/utils/elements'

const svgText_1 = `
<svg id="svg_1" xmlns="http://www.w3.org/2000/svg" viewBox="1 2  3   4">
  <g id="g_1">
    <rect id="rect_1" />
    <text id="text_1">message</text>
  </g>
</svg>
`

const svgText_2 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="1 2  3   4">
  <rect id="rect_1" />
  <text>message</text>
</svg>
`

describe('utils/elements.ts', () => {
  describe('parseFromSvg', () => {
    it('parse SVG to a actor', () => {
      const ret = parseFromSvg(svgText_1)

      expect(ret.viewBox).toEqual({ x: 1, y: 2, width: 3, height: 4 })
      expect(ret.svgTree).toEqual(
        getElementNode({
          id: 'svg_1',
          tag: 'svg',
          attributes: {
            id: 'svg_1',
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '1 2  3   4',
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
      expect(ret.elements).toEqual([
        getBElement({ id: 'svg_1' }),
        getBElement({ id: 'g_1' }),
        getBElement({ id: 'rect_1' }),
        getBElement({ id: 'text_1' }),
      ])
    })
    it('assing a new id if a element has no id', () => {
      const ret = parseFromSvg(svgText_2)

      expect(ret.elements[0].id).not.toBe('')
      expect(ret.elements[1].id).toBe('rect_1')
      expect(ret.elements[2].id).not.toBe('')
    })
  })

  describe('cleanActors', () => {
    it('clear armatureId and boneId if the armature does not exist', () => {
      expect(
        cleanActors(
          [
            getActor({
              id: 'act_1',
              armatureId: 'arm_1',
              elements: [getBElement({ id: 'be_1', boneId: 'bor_1' })],
            }),
            getActor({
              id: 'act_2',
              armatureId: 'arm_2',
              elements: [getBElement({ id: 'be_1', boneId: 'bor_1' })],
            }),
          ],
          [getArmature({ id: 'arm_1', bones: [getBone({ id: 'bor_1' })] })]
        )
      ).toEqual([
        getActor({
          id: 'act_1',
          armatureId: 'arm_1',
          elements: [getBElement({ id: 'be_1', boneId: 'bor_1' })],
        }),
        getActor({
          id: 'act_2',
          armatureId: '',
          elements: [getBElement({ id: 'be_1', boneId: '' })],
        }),
      ])
    })
    it('clear boneId if the bone does not exist', () => {
      expect(
        cleanActors(
          [
            getActor({
              id: 'act_1',
              armatureId: 'arm_1',
              elements: [
                getBElement({ id: 'be_1', boneId: 'bor_1' }),
                getBElement({ id: 'be_2', boneId: 'bor_2' }),
              ],
            }),
          ],
          [getArmature({ id: 'arm_1', bones: [getBone({ id: 'bor_1' })] })]
        )
      ).toEqual([
        getActor({
          id: 'act_1',
          armatureId: 'arm_1',
          elements: [
            getBElement({ id: 'be_1', boneId: 'bor_1' }),
            getBElement({ id: 'be_2', boneId: '' }),
          ],
        }),
      ])
    })
  })

  describe('inheritWeight', () => {
    it('inhefit old weight info to new elements', () => {
      expect(
        inheritWeight(
          getActor({
            id: 'old_act',
            armatureId: 'old_arm',
            elements: [
              getBElement({ id: 'old_elm_1', boneId: 'old_bone_1' }),
              getBElement({ id: 'old_elm_2', boneId: 'old_bone_2' }),
              getBElement({ id: 'old_elm_3', boneId: 'old_bone_3' }),
            ],
            svgTree: getElementNode({ id: 'old_svg' }),
          }),
          getActor({
            id: 'new_act',
            armatureId: '',
            elements: [
              getBElement({ id: 'old_elm_1', boneId: 'old_bone_1' }),
              getBElement({ id: 'old_elm_2', boneId: 'old_bone_2' }),
              getBElement({ id: 'new_elm_3', boneId: 'new_bone_3' }),
            ],
            svgTree: getElementNode({ id: 'new_svg' }),
          })
        )
      ).toEqual(
        getActor({
          id: 'new_act',
          armatureId: 'old_arm',
          elements: [
            getBElement({ id: 'old_elm_1', boneId: 'old_bone_1' }),
            getBElement({ id: 'old_elm_2', boneId: 'old_bone_2' }),
            getBElement({ id: 'new_elm_3', boneId: 'new_bone_3' }),
          ],
          svgTree: getElementNode({ id: 'new_svg' }),
        })
      )
    })
  })

  describe('flatElementTree', () => {
    it('flat element nodes tree', () => {
      const tree = getElementNode({
        id: 'svg_1',
        tag: 'svg',
        children: [
          getElementNode({
            id: 'g_1',
            tag: 'g',
            children: [
              getElementNode({
                id: 'rect_1',
                tag: 'rect',
              }),
              getElementNode({
                id: 'text_1',
                tag: 'text',
                children: ['message'],
              }),
            ],
          }),
        ],
      })

      expect(flatElementTree([tree]).map((n) => n.id)).toEqual([
        'svg_1',
        'g_1',
        'rect_1',
        'text_1',
      ])
    })
  })
})
