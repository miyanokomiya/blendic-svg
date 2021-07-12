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
  getGraphObject,
  getTransform,
} from '/@/models'
import {
  cleanActors,
  createGraphNodeContext,
  flatElementTree,
  getPlainSvgTree,
  getTreeFromElementNode,
  inheritWeight,
  isPlainText,
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
  describe('getPlainSvgTree', () => {
    it('should return svg element with empty children', () => {
      const svg = getPlainSvgTree()
      expect(svg.id).toBe('svg')
      expect(svg.tag).toBe('svg')
      expect(svg.attributes).toEqual({
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 400 400',
        'font-family': 'sans-serif',
      })
      expect(svg.children).toEqual([])
    })
  })

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

  describe('getTreeFromElementNode', () => {
    it('should convert svg element to tree node', () => {
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
                id: 'rect_2',
                tag: 'rect',
              }),
            ],
          }),
        ],
      })
      expect(getTreeFromElementNode(tree)).toEqual({
        id: 'svg_1',
        name: 'svg #svg_1',
        children: [
          {
            id: 'g_1',
            name: 'g #g_1',
            children: [
              {
                id: 'rect_1',
                name: 'rect #rect_1',
                children: [],
              },
              {
                id: 'rect_2',
                name: 'rect #rect_2',
                children: [],
              },
            ],
          },
        ],
      })
    })
    it('should drop string items', () => {
      const tree = getElementNode({
        id: 'svg_1',
        tag: 'svg',
        children: [
          getElementNode({
            id: 'text_1',
            tag: 'text',
            children: ['message', 'abc'],
          }),
        ],
      })
      expect(getTreeFromElementNode(tree)).toEqual({
        id: 'svg_1',
        name: 'svg #svg_1',
        children: [
          {
            id: 'text_1',
            name: 'text #text_1',
            children: [],
          },
        ],
      })
    })
    it('should drop meta items', () => {
      const tree = getElementNode({
        id: 'svg_1',
        tag: 'svg',
        children: [
          getElementNode({
            id: 'script_1',
            tag: 'script',
            children: [],
          }),
          getElementNode({
            id: 'defs_1',
            tag: 'defs',
            children: [],
          }),
        ],
      })
      expect(getTreeFromElementNode(tree)).toEqual({
        id: 'svg_1',
        name: 'svg #svg_1',
        children: [],
      })
    })
  })

  describe('createGraphNodeContext', () => {
    describe('should return a context to setTransform', () => {
      it('to replace transform', () => {
        const context = createGraphNodeContext(
          { a: getBElement({ id: 'a' }) },
          10
        )
        context.setTransform('a', getTransform({ rotate: 20 }))
        expect(context.getObjectMap()).toEqual({
          a: {
            id: 'a',
            elementId: 'a',
            transform: getTransform({ rotate: 20 }),
          },
        })
        context.setTransform('a', getTransform({ rotate: 50 }))
        expect(context.getObjectMap()).toEqual({
          a: {
            id: 'a',
            elementId: 'a',
            transform: getTransform({ rotate: 50 }),
          },
        })
      })
      it('to fodl transform if inhefit is true', () => {
        const context = createGraphNodeContext(
          { a: getBElement({ id: 'a' }) },
          10
        )
        context.setTransform('a', getTransform({ rotate: 20 }))
        context.setTransform('a', getTransform({ rotate: 50 }), true)
        expect(context.getObjectMap()).toEqual({
          a: {
            id: 'a',
            elementId: 'a',
            transform: getTransform({ rotate: 70 }),
          },
        })
      })
    })
    it('should return a context to getTransform', () => {
      const context = createGraphNodeContext(
        { a: getBElement({ id: 'a' }) },
        10
      )
      context.setTransform('a', getTransform({ rotate: 20 }))
      expect(context.getTransform('a')).toEqual(getTransform({ rotate: 20 }))
    })
    describe('should return a context to setFill', () => {
      it('to set fill', () => {
        const context = createGraphNodeContext(
          { a: getBElement({ id: 'a' }) },
          10
        )
        context.setFill('a', getTransform({ rotate: 20 }))
        expect(context.getObjectMap()).toEqual({
          a: {
            id: 'a',
            elementId: 'a',
            fill: getTransform({ rotate: 20 }),
          },
        })
        context.setFill('a', getTransform({ rotate: 50 }))
        expect(context.getObjectMap()).toEqual({
          a: {
            id: 'a',
            elementId: 'a',
            fill: getTransform({ rotate: 50 }),
          },
        })
      })
      it('to set fill recursively', () => {
        const context = createGraphNodeContext({}, 10)
        const g1 = context.createObject('g')
        const rect1 = context.createObject('rect', { parent: g1 })
        context.setFill(g1, getTransform({ rotate: 20 }))

        expect(context.getObjectMap()).toEqual({
          [g1]: {
            id: g1,
            tag: 'g',
            fill: getTransform({ rotate: 20 }),
            create: true,
          },
          [rect1]: {
            id: rect1,
            tag: 'rect',
            parent: g1,
            fill: getTransform({ rotate: 20 }),
            create: true,
          },
        })
      })
    })
    describe('should return a context to setStroke', () => {
      it('to set stroke', () => {
        const context = createGraphNodeContext(
          { a: getBElement({ id: 'a' }) },
          10
        )
        context.setStroke('a', getTransform({ rotate: 20 }))
        expect(context.getObjectMap()).toEqual({
          a: {
            id: 'a',
            elementId: 'a',
            stroke: getTransform({ rotate: 20 }),
          },
        })
        context.setStroke('a', getTransform({ rotate: 50 }))
        expect(context.getObjectMap()).toEqual({
          a: {
            id: 'a',
            elementId: 'a',
            stroke: getTransform({ rotate: 50 }),
          },
        })
      })
      it('to set fill recursively', () => {
        const context = createGraphNodeContext({}, 10)
        const g1 = context.createObject('g')
        const rect1 = context.createObject('rect', { parent: g1 })
        context.setStroke(g1, getTransform({ rotate: 20 }))

        expect(context.getObjectMap()).toEqual({
          [g1]: {
            id: g1,
            tag: 'g',
            stroke: getTransform({ rotate: 20 }),
            create: true,
          },
          [rect1]: {
            id: rect1,
            tag: 'rect',
            parent: g1,
            stroke: getTransform({ rotate: 20 }),
            create: true,
          },
        })
      })
    })
    describe('setAttributes', () => {
      it('should add attributes', () => {
        const context = createGraphNodeContext(
          { a: getBElement({ id: 'a' }) },
          10
        )
        context.setAttributes('a', { x: 10 })
        context.setAttributes('a', { y: 20 })
        expect(context.getObjectMap()).toEqual({
          a: {
            id: 'a',
            elementId: 'a',
            attributes: { x: 10, y: 20 },
          },
        })
      })
      it('should replace attributes if replace = true', () => {
        const context = createGraphNodeContext(
          { a: getBElement({ id: 'a' }) },
          10
        )
        context.setAttributes('a', { x: 10 })
        context.setAttributes('a', { y: 20 }, true)
        expect(context.getObjectMap()).toEqual({
          a: {
            id: 'a',
            elementId: 'a',
            attributes: { y: 20 },
          },
        })
      })
    })
    it('should return a context to getFrame', () => {
      const context = createGraphNodeContext(
        { a: getBElement({ id: 'a' }) },
        10
      )
      expect(context.getFrame()).toBe(10)
    })
    describe('cloneObject', () => {
      it('should return a context to cloneObject', () => {
        const context = createGraphNodeContext(
          { a: getBElement({ id: 'a' }) },
          10
        )
        context.setTransform('a', getTransform({ rotate: 20 }))
        const clonedId = context.cloneObject('a', { parent: 'p' })
        const ret = context.getObjectMap()

        expect(ret).toEqual({
          a: {
            id: 'a',
            elementId: 'a',
            transform: getTransform({ rotate: 20 }),
          },
          [clonedId]: {
            id: clonedId,
            elementId: 'a',
            transform: getTransform({ rotate: 20 }),
            parent: 'p',
            clone: true,
          },
        })
      })
      it('should clone a target with create = true if the target has create = true', () => {
        const context = createGraphNodeContext({}, 10)
        const createdId = context.createObject('rect', {
          attributes: { x: 10 },
        })
        const clonedId = context.cloneObject(createdId)
        const ret = context.getObjectMap()

        expect(ret).toEqual({
          [createdId]: getGraphObject({
            id: createdId,
            tag: 'rect',
            create: true,
            attributes: { x: 10 },
          }),
          [clonedId]: getGraphObject({
            id: clonedId,
            tag: 'rect',
            create: true,
            attributes: { x: 10 },
          }),
        })
      })
      it('should set id pref', () => {
        const context = createGraphNodeContext(
          { a: getBElement({ id: 'a' }) },
          10
        )
        context.cloneObject('a', {}, 'pre')
        const ret = context.getObjectMap()

        expect(ret).toEqual({
          a: { id: 'a', elementId: 'a' },
          pre_clone_0: {
            id: 'pre_clone_0',
            elementId: 'a',
            clone: true,
          },
        })
      })
      describe('when the target has children', () => {
        it('should clone nested created children', () => {
          const context = createGraphNodeContext({}, 10)
          const created1 = context.createObject('g', { tag: 'g' })
          const created2 = context.createObject('g', {
            tag: 'g',
            parent: created1,
          })
          const clonedId = context.cloneObject(created1)
          const ret = context.getObjectMap()

          delete ret[created1]
          delete ret[created2]
          expect(ret[clonedId]).toEqual({
            id: clonedId,
            tag: 'g',
            create: true,
          })
          delete ret[clonedId]
          const id = Object.keys(ret)[0]
          expect(ret[id]).toEqual({
            id,
            tag: 'g',
            create: true,
            parent: clonedId,
          })
        })
        it('should clone nested cloned children', () => {
          const context = createGraphNodeContext({}, 10)

          const parent = context.createObject('g')
          const child1 = context.createObject('g', { parent })
          const child2 = context.createObject('g', { parent: child1 })

          const clonedId = context.cloneObject(parent)
          const ret = context.getObjectMap()

          delete ret[parent]
          delete ret[child1]
          delete ret[child2]

          expect(ret[clonedId]).toEqual({
            id: clonedId,
            tag: 'g',
            create: true,
          })
          delete ret[clonedId]

          expect(Object.keys(ret)).toHaveLength(2)

          const nested1 = Object.values(ret).find((v) => v.parent === clonedId)!
          expect(nested1).toEqual({
            id: nested1.id,
            create: true,
            tag: 'g',
            parent: clonedId,
          })
          const nested2 = Object.values(ret).find(
            (v) => v.parent === nested1.id
          )!
          expect(nested2).toEqual({
            id: nested2.id,
            create: true,
            tag: 'g',
            parent: nested1.id,
          })
        })
        it('should set id pref', () => {
          const context = createGraphNodeContext({}, 10)

          const parent = context.createObject('g')
          const child1 = context.createObject('g', { parent })
          const child2 = context.createObject('g', { parent: child1 })

          context.cloneObject(parent, {}, 'pre')
          const ret = context.getObjectMap()

          delete ret[parent]
          delete ret[child1]
          delete ret[child2]

          expect(ret).toEqual({
            pre_clone_0: {
              id: 'pre_clone_0',
              tag: 'g',
              create: true,
            },
            pre_clone_1: {
              id: 'pre_clone_1',
              tag: 'g',
              create: true,
              parent: 'pre_clone_0',
            },
            pre_clone_2: {
              id: 'pre_clone_2',
              tag: 'g',
              create: true,
              parent: 'pre_clone_1',
            },
          })
        })
      })
    })

    describe('should return a context to createCloneGroupObject', () => {
      it('to create group object for cloning', () => {
        const context = createGraphNodeContext(
          { a: getBElement({ id: 'a' }) },
          10
        )
        const id = context.createCloneGroupObject('a', { id: 'b' })
        const ret = context.getObjectMap()

        expect(id).toBe('b')
        expect(ret).toEqual({
          a: { id: 'a', elementId: 'a' },
          b: {
            id: 'b',
            clone: false,
            create: true,
            elementId: 'a',
            tag: 'g',
          },
        })
      })
    })

    describe('should return a context to createObject', () => {
      it('to create new object', () => {
        const context = createGraphNodeContext({}, 10)
        const id = context.createObject('rect', { attributes: { x: 10 } })
        const ret = context.getObjectMap()

        expect(Object.values(ret)[0]).toEqual({
          id,
          create: true,
          tag: 'rect',
          attributes: { x: 10 },
        })
      })
      it('extends id if it has been set', () => {
        const context = createGraphNodeContext({}, 10)
        context.createObject('rect', { id: 'a' })
        const ret = context.getObjectMap()

        expect(Object.values(ret)[0]).toEqual({
          id: 'a',
          create: true,
          tag: 'rect',
        })
      })
    })
  })

  describe('isPlainText', () => {
    it('should return true if elm is string', () => {
      expect(isPlainText('a')).toBe(true)
      expect(isPlainText({} as any)).toBe(false)
    })
  })
})
