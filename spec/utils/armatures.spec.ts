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

import * as target from '../../src/utils/armatures'
import { getBone, getTransform } from '../../src/models/index'
import { getConstraint, getOptionByType } from '/@/utils/constraints'
import { assertBoneGeometry, assertVec } from 'spec/tools'
import { add } from 'okageo'
import { toBoneSpaceFn } from '/@/utils/geometry'

describe('utils/armatures', () => {
  describe('invertPoseTransform', () => {
    it('invert pose transform', () => {
      expect(
        target.invertPoseTransform(
          getTransform({
            translate: { x: 20, y: 30 },
            scale: { x: 2, y: 4 },
            rotate: 45,
          })
        )
      ).toEqual(
        getTransform({
          translate: { x: -20, y: -30 },
          scale: { x: 1 / 2, y: 1 / 4 },
          rotate: -45,
          origin: { x: -0, y: -0 },
        })
      )
    })
    it('invert zero scale to zero scale', () => {
      expect(
        target.invertPoseTransform(
          getTransform({
            translate: { x: 20, y: 30 },
            scale: { x: 0, y: 0 },
            rotate: 45,
          })
        )
      ).toEqual(
        getTransform({
          translate: { x: -20, y: -30 },
          scale: { x: 0, y: 0 },
          rotate: -45,
          origin: { x: -0, y: -0 },
        })
      )
    })
  })

  describe('posedTransform', () => {
    it('should apply pose transform', () => {
      expect(
        target.posedTransform(
          getBone({
            head: { x: 0, y: 0 },
            tail: { x: 0, y: 10 },
          }),
          [
            getTransform({
              translate: { x: 10, y: 20 },
              scale: { x: 4, y: 2 },
            }),
          ]
        )
      ).toEqual(
        getBone({
          head: { x: 10, y: 20 },
          tail: { x: 10, y: 40 },
          transform: getTransform({
            scale: { x: 2, y: 1 },
          }),
        })
      )
    })
  })

  describe('extrudeFromParent', () => {
    const parent = getBone({ id: 'parent', tail: { x: 1, y: 2 } })

    it("fromHead: false => extrude from parent's tail", () => {
      expect({ ...target.extrudeFromParent(parent), id: '1' }).toEqual(
        getBone({
          id: '1',
          head: parent.tail,
          tail: parent.tail,
          parentId: parent.id,
          connected: true,
        })
      )
    })
    it("fromHead: true => extrude from parent's head & extends parent's connection", () => {
      expect({
        ...target.extrudeFromParent({ ...parent, connected: false }, true),
        id: '1',
      }).toEqual(
        getBone({
          id: '1',
          head: parent.head,
          tail: parent.head,
          parentId: parent.parentId,
          connected: false,
        })
      )
      expect({
        ...target.extrudeFromParent({ ...parent, connected: true }, true),
        id: '1',
      }).toEqual(
        getBone({
          id: '1',
          head: parent.head,
          tail: parent.head,
          parentId: parent.parentId,
          connected: true,
        })
      )
    })
  })

  describe('adjustConnectedPosition', () => {
    const parent = getBone({ id: 'parent', tail: { x: 1, y: 2 } })

    it("connected: true => connect child's head to parent's tail", () => {
      const child = getBone({
        id: 'child',
        head: { x: 0, y: 0 },
        parentId: 'parent',
        connected: true,
      })
      expect(target.adjustConnectedPosition([parent, child])).toEqual([
        parent,
        { ...child, head: { x: 1, y: 2 } },
      ])
    })
    it('connected: false => do nothing', () => {
      const child = getBone({
        id: 'child',
        head: { x: 0, y: 0 },
        parentId: 'parent',
        connected: false,
      })
      expect(target.adjustConnectedPosition([parent, child])).toEqual([
        parent,
        child,
      ])
    })
  })

  describe('selectBone', () => {
    const parent = getBone({ id: 'parent' })
    const selecgted = getBone({
      id: 'selecgted',
      parentId: 'parent',
      connected: true,
    })
    const brother = getBone({
      id: 'brother',
      parentId: 'parent',
      connected: true,
    })
    const unconnectedBrother = getBone({
      id: 'unconnectedBrother',
      parentId: 'parent',
      connected: false,
    })
    const child = getBone({
      id: 'child',
      parentId: 'selecgted',
      connected: true,
    })
    const unconnectedChild = getBone({
      id: 'unconnectedChild',
      parentId: 'selecgted',
      connected: false,
    })

    it('should return empty if the selected state is empty', () => {
      expect(
        target.selectBone(
          [parent, selecgted, brother, unconnectedBrother, child],
          selecgted.id,
          {}
        )
      ).toEqual({})
    })

    describe('head: true', () => {
      it("connected: true => also select parent's tail & brother's head", () => {
        expect(
          target.selectBone(
            [parent, selecgted, brother, unconnectedBrother, child],
            selecgted.id,
            { head: true }
          )
        ).toEqual({
          parent: { tail: true },
          selecgted: { head: true },
          brother: { head: true },
        })
      })
      it("connected: false => not select parent's tail", () => {
        expect(
          target.selectBone(
            [parent, { ...selecgted, connected: false }, child],
            selecgted.id,
            { head: true }
          )
        ).toEqual({
          selecgted: { head: true },
        })
      })
    })
    describe('tail: true', () => {
      it("also select connected children's head", () => {
        expect(
          target.selectBone(
            [parent, selecgted, child, unconnectedChild],
            selecgted.id,
            { tail: true }
          )
        ).toEqual({
          selecgted: { tail: true },
          child: { head: true },
        })
      })
    })
  })

  describe('selectBoneInRect', () => {
    it('get bone selected state map in the rect', () => {
      const rect = { x: 0, y: 0, width: 10, height: 20 }
      const boneMap = {
        a: getBone({ id: 'a', head: { x: 1, y: 1 }, tail: { x: 20, y: 20 } }),
        b: getBone({
          id: 'b',
          head: { x: -1, y: -1 },
          tail: { x: -20, y: -20 },
        }),
        c: getBone({ id: 'c', head: { x: 0, y: 0 }, tail: { x: 10, y: 20 } }),
      }
      expect(target.selectBoneInRect(rect, boneMap)).toEqual({
        a: { head: true },
        c: { head: true, tail: true },
      })
    })
  })

  describe('getBoneWrapperRect', () => {
    it('should return a rectangle wrapping the bone', () => {
      expect(
        target.getBoneWrapperRect(
          getBone({
            head: { x: 1, y: 2 },
            tail: { x: 11, y: 7 },
            transform: getTransform({ scale: { x: 2, y: 2 } }),
          })
        )
      ).toEqual({ x: 1, y: 2, width: 20, height: 10 })
    })
  })

  describe('fixConnections', () => {
    it("connected: true => connect child's head to parent's tail", () => {
      const parent = getBone({ id: 'parent', tail: { x: 1, y: 2 } })
      const connected = getBone({
        id: 'connected',
        parentId: 'parent',
        connected: true,
        head: { x: 10, y: 20 },
      })
      const unconnected = getBone({
        id: 'unconnected',
        parentId: 'parent',
        connected: false,
      })
      const ret = target.fixConnections([parent, connected, unconnected])
      expect(ret[0]).toEqual(parent)
      expect(ret[2]).toEqual(unconnected)
      assertBoneGeometry(
        ret[1],
        getBone({
          id: 'connected',
          head: { x: 1, y: 2 },
        })
      )
    })
    it('reset the connection if the parent is not found', () => {
      const connected = getBone({
        id: 'connected',
        parentId: 'parent',
        connected: true,
        head: { x: 10, y: 20 },
      })
      const unconnected = getBone({
        id: 'unconnected',
        parentId: 'parent',
        connected: false,
      })
      const ret = target.fixConnections([connected, unconnected])
      expect(ret[0]).toEqual({
        ...connected,
        parentId: '',
        connected: false,
      })
      expect(ret[1]).toEqual({
        ...unconnected,
        parentId: '',
        connected: false,
      })
    })
  })

  describe('updateConnections', () => {
    it("parent's tail != child's head => connected is false", () => {
      const parent = getBone({ id: 'parent', tail: { x: 1, y: 2 } })
      const connected = getBone({
        id: 'connected',
        parentId: 'parent',
        connected: true,
        head: { x: 1, y: 2 },
      })
      const unconnected = getBone({
        id: 'unconnected',
        parentId: 'parent',
        connected: true,
        head: { x: 10, y: 20 },
      })
      expect(
        target.updateConnections([parent, connected, unconnected])
      ).toEqual({
        connected: { connected: true },
        unconnected: { connected: false },
      })
    })
    it('cannot find parent => set no parent', () => {
      const connected = getBone({
        id: 'connected',
        parentId: 'parent',
        connected: true,
        head: { x: 10, y: 20 },
      })
      const unconnected = getBone({
        id: 'unconnected',
        parentId: 'parent',
        connected: false,
        head: { x: 10, y: 20 },
      })
      expect(target.updateConnections([connected, unconnected])).toEqual({
        connected: { connected: false, parentId: '' },
        unconnected: { connected: false, parentId: '' },
      })
    })
  })

  describe('getSelectedBonesOrigin', () => {
    it('retuns selected bones origin', () => {
      const boneMap = {
        1: getBone({ id: '1', head: { x: 0, y: 1 }, tail: { x: 2, y: 3 } }),
        2: getBone({ id: '2', head: { x: 10, y: 11 }, tail: { x: 12, y: 13 } }),
        3: getBone({ id: '3', head: { x: 20, y: 21 }, tail: { x: 24, y: 25 } }),
        4: getBone({
          id: '4',
          head: { x: 100, y: 100 },
          tail: { x: 100, y: 100 },
        }),
      }
      const selectedState = {
        1: { head: true, tail: true },
        2: { head: true },
        3: { tail: true },
        4: {},
      } as const
      expect(target.getSelectedBonesOrigin(boneMap, selectedState)).toEqual({
        x: 9,
        y: 10,
      })
    })
  })

  describe('getPosedBoneHeadsOrigin', () => {
    it('retuns selected bones origin', () => {
      const boneMap = {
        1: getBone({ id: '1', head: { x: 0, y: 2 }, tail: { x: 2, y: 3 } }),
        2: getBone({ id: '2', head: { x: 10, y: 12 }, tail: { x: 12, y: 13 } }),
        3: getBone({ id: '3', head: { x: 5, y: 7 }, tail: { x: 24, y: 25 } }),
      }
      expect(target.getPosedBoneHeadsOrigin(boneMap)).toEqual({
        x: 5,
        y: 7,
      })
    })
  })

  describe('getTree', () => {
    it('get nodes tree: nested children', () => {
      const boneMap = {
        a: { id: 'a', parentId: '', name: '' },
        aa: { id: 'aa', parentId: 'a', name: '' },
        aaa: { id: 'aaa', parentId: 'aa', name: '' },
        b: { id: 'b', parentId: '', name: '' },
      }
      expect(target.getTree(boneMap)).toEqual([
        {
          id: 'a',
          name: '',
          parentId: '',
          children: [
            {
              id: 'aa',
              name: '',
              children: [{ id: 'aaa', name: '', children: [], parentId: 'aa' }],
              parentId: 'a',
            },
          ],
        },
        { id: 'b', name: '', children: [], parentId: '' },
      ])
    })
    it('get nodes tree: multi children', () => {
      const boneMap = {
        a: { id: 'a', parentId: '', name: '' },
        aa: { id: 'aa', parentId: 'a', name: '' },
        ab: { id: 'ab', parentId: 'a', name: '' },
      }
      expect(target.getTree(boneMap)).toEqual([
        {
          id: 'a',
          name: '',
          parentId: '',
          children: [
            { id: 'aa', name: '', children: [], parentId: 'a' },
            { id: 'ab', name: '', children: [], parentId: 'a' },
          ],
        },
      ])
    })
    it('ignore the parent does not exist', () => {
      const boneMap = {
        a: { id: 'a', parentId: '', name: '' },
        aa: { id: 'aa', parentId: 'a', name: '' },
        ab: { id: 'ab', parentId: 'b', name: '' },
      }
      expect(target.getTree(boneMap)).toEqual([
        {
          id: 'a',
          name: '',
          parentId: '',
          children: [{ id: 'aa', name: '', children: [], parentId: 'a' }],
        },
        { id: 'ab', name: '', children: [], parentId: 'b' },
      ])
    })
  })

  describe('extendTransform', () => {
    describe('translate', () => {
      it('connected: false => add parent translate', () => {
        const p = getBone({
          tail: { x: 1, y: 1 },
          transform: getTransform({
            translate: { x: 10, y: 20 },
          }),
        })
        const b = target.extendTransform(
          p,
          getBone({
            head: { x: 2, y: 3 },
            transform: getTransform({
              translate: { x: 2, y: 3 },
            }),
          })
        )
        assertBoneGeometry(
          b,
          getBone({
            head: { x: 2, y: 3 },
            transform: getTransform({
              translate: add(
                { x: 2, y: 3 },
                toBoneSpaceFn(b).toLocal(
                  toBoneSpaceFn(p).toWorld({ x: 10, y: 20 })
                )
              ),
            }),
          })
        )
      })
      it('connected: true => replace by parent translate', () => {
        const p = getBone({
          tail: { x: 1, y: 1 },
          transform: getTransform({
            translate: { x: 10, y: 20 },
          }),
        })
        const b = target.extendTransform(
          p,
          getBone({
            head: { x: 2, y: 3 },
            transform: getTransform({
              translate: { x: 2, y: 3 },
            }),
            connected: true,
          })
        )
        assertBoneGeometry(
          b,
          getBone({
            head: { x: 2, y: 3 },
            transform: getTransform({
              translate: toBoneSpaceFn(b).toLocal(
                toBoneSpaceFn(p).toWorld({ x: 10, y: 20 })
              ),
            }),
            connected: true,
          })
        )
      })
    })
    describe('scale', () => {
      it('inheritScale: true', () => {
        expect(target.extendTransform(getBone(), getBone())).toEqual(getBone())

        const b = target.extendTransform(
          getBone({
            head: { x: 1, y: 1 },
            tail: { x: 2, y: 1 },
            transform: getTransform({
              scale: { x: 2, y: 3 },
            }),
          }),
          getBone({
            head: { x: 2, y: 3 },
            transform: getTransform({
              scale: { x: 2, y: 3 },
              rotate: 45,
            }),
          })
        )
        assertBoneGeometry(
          b,
          getBone({
            head: { x: 2, y: 3 },
            transform: getTransform({
              translate: toBoneSpaceFn(b).toLocal({ x: 2, y: 2 }),
              scale: { x: 4, y: 9 },
              rotate: 45,
            }),
          })
        )
      })
      it('inheritScale: false', () => {
        expect(target.extendTransform(getBone(), getBone())).toEqual(getBone())

        const b = target.extendTransform(
          getBone({
            head: { x: 1, y: 1 },
            tail: { x: 2, y: 1 },
            transform: getTransform({
              scale: { x: 2, y: 3 },
            }),
          }),
          getBone({
            head: { x: 2, y: 3 },
            transform: getTransform({
              scale: { x: 2, y: 3 },
              rotate: 45,
            }),
            inheritScale: false,
          })
        )
        assertBoneGeometry(
          b,
          getBone({
            head: { x: 2, y: 3 },
            transform: getTransform({
              translate: toBoneSpaceFn(b).toLocal({ x: 2, y: 2 }),
              scale: { x: 2, y: 3 },
              rotate: 45,
            }),
            inheritScale: false,
          })
        )
      })
    })
    describe('rotate', () => {
      const parent = getBone({
        head: { x: 1, y: 1 },
        tail: { x: 2, y: 1 },
        transform: getTransform({
          rotate: 90,
        }),
      })
      const child = getBone({
        head: { x: 2, y: 3 },
        transform: getTransform({
          rotate: 45,
        }),
      })
      it('inheritRotation: true', () => {
        expect(target.extendTransform(getBone(), getBone())).toEqual(getBone())
        const b = target.extendTransform(parent, child)
        assertBoneGeometry(
          b,
          getBone({
            head: { x: 2, y: 3 },
            transform: getTransform({
              translate: toBoneSpaceFn(b).toLocal({ x: -3, y: -1 }),
              rotate: 135,
            }),
          })
        )
      })
      it('inheritRotation: false', () => {
        expect(target.extendTransform(getBone(), getBone())).toEqual(getBone())

        const b = target.extendTransform(parent, {
          ...child,
          inheritRotation: false,
        })
        assertBoneGeometry(
          b,
          getBone({
            head: { x: 2, y: 3 },
            inheritRotation: false,
            transform: getTransform({
              translate: toBoneSpaceFn(b).toLocal({ x: -3, y: -1 }),
              rotate: 45,
            }),
          })
        )
      })
    })
  })

  describe('getTransformedBoneMap', () => {
    it('get transformed bone map', () => {
      expect(
        target.getTransformedBoneMap(
          {
            a: getBone({
              id: 'a',
              parentId: '',
              transform: getTransform({ rotate: 10 }),
            }),
            aa: getBone({
              id: 'aa',
              parentId: 'a',
              transform: getTransform({ rotate: 20 }),
            }),
            aaa: getBone({
              id: 'aaa',
              parentId: 'aa',
              transform: getTransform({ rotate: 30 }),
            }),
            b: getBone({
              id: 'b',
              parentId: '',
              transform: getTransform({ rotate: 30 }),
            }),
          },
          {}
        )
      ).toEqual({
        a: getBone({
          id: 'a',
          parentId: '',
          transform: getTransform({ rotate: 10 }),
        }),
        aa: getBone({
          id: 'aa',
          parentId: 'a',
          transform: getTransform({ rotate: 30 }),
        }),
        aaa: getBone({
          id: 'aaa',
          parentId: 'aa',
          transform: getTransform({ rotate: 60 }),
        }),
        b: getBone({
          id: 'b',
          parentId: '',
          transform: getTransform({ rotate: 30 }),
        }),
      })
    })
  })

  describe('getAnySelectedBones', () => {
    it('get any selected bones', () => {
      expect(
        target.getAnySelectedBones(
          {
            a: getBone({
              id: 'a',
              parentId: '',
            }),
            aa: getBone({
              id: 'aa',
              parentId: 'a',
            }),
            aaa: getBone({
              id: 'aaa',
              parentId: 'aa',
            }),
            b: getBone({
              id: 'b',
              parentId: '',
            }),
          },
          {
            aa: { head: true },
            aaa: { head: true },
            b: { head: true },
          }
        )
      ).toEqual({
        aa: getBone({
          id: 'aa',
          parentId: 'a',
        }),
        aaa: getBone({
          id: 'aaa',
          parentId: 'aa',
        }),
        b: getBone({
          id: 'b',
          parentId: '',
        }),
      })
    })
  })

  describe('getAllSelectedBones', () => {
    it('get all selected bones', () => {
      expect(
        target.getAllSelectedBones(
          {
            a: getBone({
              id: 'a',
              parentId: '',
            }),
            aa: getBone({
              id: 'aa',
              parentId: 'a',
            }),
            aaa: getBone({
              id: 'aaa',
              parentId: 'aa',
            }),
            b: getBone({
              id: 'b',
              parentId: '',
            }),
          },
          {
            aa: { head: true, tail: true },
            aaa: { head: true },
            b: { head: true },
          }
        )
      ).toEqual({
        aa: getBone({
          id: 'aa',
          parentId: 'a',
        }),
      })
    })
  })

  describe('getPoseSelectedBones', () => {
    it('if parent is selected the children are ignored', () => {
      expect(
        target.getPoseSelectedBones(
          {
            a: getBone({
              id: 'a',
              parentId: '',
            }),
            aa: getBone({
              id: 'aa',
              parentId: 'a',
            }),
            aaa: getBone({
              id: 'aaa',
              parentId: 'aa',
            }),
            b: getBone({
              id: 'b',
              parentId: '',
            }),
          },
          {
            aa: { head: true },
            aaa: { head: true },
            b: { head: true },
          }
        )
      ).toEqual({
        aa: getBone({
          id: 'aa',
          parentId: 'a',
        }),
        b: getBone({
          id: 'b',
          parentId: '',
        }),
      })
    })
  })

  describe('interpolateTransform', () => {
    it('interpolate scale', () => {
      const ret = target.interpolateTransform(
        getTransform({ scale: { x: 1, y: 2 } }),
        getTransform({ scale: { x: 2, y: 4 } }),
        0.2
      )
      expect(ret.scale.x).toBeCloseTo(1.2)
      expect(ret.scale.y).toBeCloseTo(2.4)
    })
    it('interpolate translate', () => {
      const ret = target.interpolateTransform(
        getTransform({ translate: { x: 1, y: 2 } }),
        getTransform({ translate: { x: 2, y: 4 } }),
        0.2
      )
      expect(ret.translate.x).toBeCloseTo(1.2)
      expect(ret.translate.y).toBeCloseTo(2.4)
    })
    it('interpolate origin', () => {
      const ret = target.interpolateTransform(
        getTransform({ origin: { x: 1, y: 2 } }),
        getTransform({ origin: { x: 2, y: 4 } }),
        0.2
      )
      expect(ret.origin.x).toBeCloseTo(1.2)
      expect(ret.origin.y).toBeCloseTo(2.4)
    })
    it('interpolate rotate', () => {
      const ret = target.interpolateTransform(
        getTransform({ rotate: 20 }),
        getTransform({ rotate: 30 }),
        0.2
      )
      expect(ret.rotate).toBeCloseTo(22)
    })
  })

  describe('immigrateBoneRelations', () => {
    const aa = getBone({
      id: 'aa',
      parentId: 'c',
      connected: true,
      constraints: ['ik'],
    })
    const ik = getConstraint({
      id: 'ik',
      type: 'IK',
      option: getOptionByType('IK', { targetId: 'b' }),
    })

    it('should replace the props for a parent', () => {
      const ret = target.immigrateBoneRelations(
        { a: 'aa', b: 'bb' },
        [aa, getBone({ id: 'bb', parentId: 'a' })],
        { ik }
      )
      expect(ret.bones[0].id).toBe('aa')
      expect(ret.bones[0].parentId).toBe('c')
      expect(ret.bones[0].connected).toBe(true)
      expect(ret.bones[1].parentId).toBe('aa')
      expect(ret.bones[1].connected).toBe(false)
    })
    it('should replace ids of constraints', () => {
      const ret = target.immigrateBoneRelations(
        { a: 'aa', b: 'bb' },
        [aa, getBone({ id: 'bb', parentId: 'a' })],
        { ik }
      )
      expect(ret.bones[0].constraints[0]).toBe('ik')
      expect(
        (ret.constraints.find((c) => c.id === 'ik')?.option as any).targetId
      ).toBe('bb')
    })
    describe('options', () => {
      it('should reset constraint ids if resetConstraintId is true', () => {
        const ret = target.immigrateBoneRelations(
          { a: 'aa' },
          [aa],
          { ik },
          {
            resetConstraintId: true,
          }
        )
        expect(ret.bones[0].id).toBe('aa')
        expect(ret.bones[0].constraints[0]).not.toBe('ik')
      })
    })
  })

  describe('duplicateBones', () => {
    it('duplicate bones with new ids & names, sorted by new name', () => {
      const ret = target.duplicateBones(
        {
          b: getBone({ id: 'b', name: 'b' }),
          a: getBone({ id: 'a', name: 'aa' }),
        },
        {},
        ['b', 'aa', 'aa.001']
      )
      expect(ret.bones.length).toBe(2)
      expect(ret.bones[0].id).not.toBe('a')
      expect(ret.bones[0].name).toBe('aa.002')
      expect(ret.bones[1].id).not.toBe('b')
      expect(ret.bones[1].name).toBe('b.001')
    })
    it('should set connected false if the parent is not duplicated together', () => {
      const ret = target.duplicateBones(
        {
          a: getBone({ id: 'a', name: 'aa', parentId: 'b', connected: true }),
        },
        {},
        ['aa']
      )
      expect(ret.bones).toHaveLength(1)
      expect(ret.bones[0]).toEqual(
        getBone({
          id: expect.anything(),
          name: 'aa.001',
          parentId: 'b',
          connected: false,
        })
      )
    })
  })

  describe('symmetrizeBones', () => {
    it('symmetrize bones having special name', () => {
      const res = target.symmetrizeBones(
        {
          a: getBone({
            id: 'a',
            name: 'a.R',
            tail: { x: 1, y: 1 },
          }),
          b: getBone({
            id: 'b',
            name: 'b.R',
            head: { x: 1, y: 1 },
            tail: { x: 2, y: 2 },
            parentId: 'a',
            connected: true,
          }),
        },
        {},
        ['b']
      )
      expect(res.bones[0].id).not.toBe('b')
      expect(res.bones[0]).toEqual(
        getBone({
          id: expect.anything(),
          name: 'b.L',
          head: { x: 1, y: 1 },
          tail: { x: 0, y: 2 },
          parentId: 'a',
          connected: true,
        })
      )
    })
    it('not symmetrize bones not having special name', () => {
      const res = target.symmetrizeBones(
        {
          a: getBone({
            id: 'a',
            name: 'a.R',
          }),
          b: getBone({
            id: 'b',
            name: 'b.Rbb',
          }),
        },
        {},
        ['a', 'b']
      )
      expect(res.bones.length).toBe(0)
    })
    it('should override symmetrized bones and inherit current id', () => {
      const res = target.symmetrizeBones(
        {
          a: getBone({
            id: 'a',
            name: 'a',
            tail: { x: 1, y: 1 },
          }),
          b_R: getBone({
            id: 'b_R',
            name: 'b.R',
            head: { x: 0, y: 0 },
            tail: { x: 1, y: 1 },
            parentId: 'a',
          }),
          b_L: getBone({
            id: 'b_L',
            name: 'b.L',
            head: { x: 10, y: 0 },
            tail: { x: 11, y: 1 },
            parentId: 'a',
          }),
        },
        {},
        ['b_R']
      )
      expect(res.bones).toHaveLength(1)
      expect(res.bones[0]).toEqual(
        getBone({
          id: 'b_L',
          name: 'b.L',
          head: { x: 2, y: 0 },
          tail: { x: 1, y: 1 },
          parentId: 'a',
        })
      )
    })
    it('should immigrate symmetrized relations', () => {
      const res = target.symmetrizeBones(
        {
          a: getBone({
            id: 'a',
            name: 'a',
            tail: { x: 0, y: 0 },
          }),
          b1_R: getBone({
            id: 'b1_R',
            name: 'b1.R',
            head: { x: 1, y: 0 },
            parentId: 'a',
          }),
          b2_R: getBone({
            id: 'b2_R',
            name: 'b2.R',
            head: { x: 2, y: 0 },
            parentId: 'b1_R',
          }),
          b1_L: getBone({
            id: 'b1_L',
            name: 'b1.L',
            head: { x: -1, y: 0 },
            parentId: 'a',
          }),
        },
        {},
        ['b2_R']
      )
      expect(res.bones).toHaveLength(1)
      expect(res.bones[0]).toEqual(
        getBone({
          id: expect.anything(),
          name: 'b2.L',
          head: { x: -2, y: 0 },
          parentId: 'b1_L',
        })
      )
    })
    it('should immigrate constraints', () => {
      const res = target.symmetrizeBones(
        {
          a: getBone({
            id: 'a',
            name: 'a',
          }),
          b1_R: getBone({
            id: 'b1_R',
            name: 'b1.R',
            head: { x: 1, y: 0 },
            parentId: 'a',
          }),
          b2_R: getBone({
            id: 'b2_R',
            name: 'b2.R',
            head: { x: 2, y: 0 },
            parentId: 'b1_R',
            constraints: ['ik_R'],
          }),
        },
        {
          ik_R: getConstraint({
            id: 'ik_R',
            type: 'IK',
            option: getOptionByType('IK', { targetId: 'b1_R' }),
          }),
        },
        ['b1_R', 'b2_R']
      )
      expect(res.bones).toHaveLength(2)
      expect(res.createdConstraints).toHaveLength(1)
      expect(res.bones[1].constraints).toEqual([res.createdConstraints[0].id])
      expect(res.createdConstraints[0].id).not.toBe('ik_R')
      expect(res.createdConstraints[0].option).toEqual(
        getOptionByType('IK', { targetId: res.bones[0].id })
      )
    })
  })

  describe('getSymmetrizedIdMap', () => {
    it('should return id map to convert src to symmetrized', () => {
      const ret = target.getSymmetrizedIdMap({
        a: { id: 'a', name: 'a.L' },
        b: { id: 'b', name: 'b' },
        c: { id: 'c', name: 'c.R' },
        aa: { id: 'aa', name: 'a.R' },
      })
      expect(ret).toEqual({
        a: 'aa',
        aa: 'a',
      })
    })
    it('should include all ids if the option is true', () => {
      const ret = target.getSymmetrizedIdMap(
        {
          a: { id: 'a', name: 'a.L' },
          b: { id: 'b', name: 'b' },
          c: { id: 'c', name: 'c.R' },
          aa: { id: 'aa', name: 'a.R' },
        },
        true
      )
      expect(ret).toEqual({
        a: 'aa',
        b: 'b',
        c: 'c',
        aa: 'a',
      })
    })
  })

  describe('symmetrizeBone', () => {
    it('symmetrize to x axis at origin', () => {
      const res = target.symmetrizeBone(
        getBone({
          head: { x: 0, y: 0 },
          tail: { x: 1, y: 1 },
        }),
        { x: 10, y: 10 }
      )
      expect(res.head.x).toBeCloseTo(20)
      expect(res.head.y).toBeCloseTo(0)
      expect(res.tail.x).toBeCloseTo(19)
      expect(res.tail.y).toBeCloseTo(1)
    })
  })

  describe('getBoneIdsWithoutDescendants', () => {
    it('should get all bone ids if target does not exist in the map', () => {
      expect(
        target.getBoneIdsWithoutDescendants(
          {
            a: getBone({ id: 'a' }),
            b: getBone({ id: 'b' }),
          },
          'unknown'
        )
      ).toEqual(['a', 'b'])
    })
    it('get bone ids without its descenedants', () => {
      expect(
        target.getBoneIdsWithoutDescendants(
          {
            parent: getBone({ id: 'parent', parentId: '' }),
            target: getBone({ id: 'target', parentId: 'parent' }),
            a: getBone({ id: 'a', parentId: 'target' }),
            b: getBone({ id: 'b', parentId: 'a' }),
            c: getBone({ id: 'c', parentId: 'b' }),
            d: getBone({ id: 'd', parentId: '' }),
          },
          'target'
        )
      ).toEqual(['parent', 'd'])
    })
    it('sorted by name', () => {
      expect(
        target.getBoneIdsWithoutDescendants(
          {
            d: getBone({ id: 'd', name: 'dd' }),
            b: getBone({ id: 'b', name: 'bb' }),
            c: getBone({ id: 'c', name: 'cc' }),
            a: getBone({ id: 'a', name: 'aa' }),
          },
          'c'
        )
      ).toEqual(['a', 'b', 'd'])
    })
  })

  describe('sortBoneByName', () => {
    it('sorte by name', () => {
      const src = [
        getBone({ id: 'd', name: 'dd' }),
        getBone({ id: 'b', name: 'bb' }),
        getBone({ id: 'c', name: 'cc' }),
        getBone({ id: 'a', name: 'aa' }),
      ]
      expect(target.sortBoneByName(src)).toEqual([
        getBone({ id: 'a', name: 'aa' }),
        getBone({ id: 'b', name: 'bb' }),
        getBone({ id: 'c', name: 'cc' }),
        getBone({ id: 'd', name: 'dd' }),
      ])
    })
  })

  describe('subdivideBones', () => {
    it('should subdivide target bones', () => {
      let count = 0
      const boneMap = {
        a: getBone({
          id: 'a',
          name: 'name_a',
          head: { x: 1, y: 2 },
          tail: { x: 11, y: 22 },
        }),
        b: getBone({
          id: 'b',
          name: 'name_b',
        }),
        c: getBone({ id: 'c' }),
      }
      expect(
        target.subdivideBones(boneMap, ['a', 'b'], () => {
          count++
          return `id_${count}`
        })
      ).toEqual({
        a: getBone({
          id: 'a',
          name: 'name_a',
          head: { x: 1, y: 2 },
          tail: { x: 6, y: 12 },
        }),
        id_1: getBone({
          id: 'id_1',
          name: 'name_a.001',
          head: { x: 6, y: 12 },
          tail: { x: 11, y: 22 },
          parentId: 'a',
          connected: true,
        }),
        b: getBone({
          id: 'b',
          name: 'name_b',
        }),
        id_2: getBone({
          id: 'id_2',
          name: 'name_b.001',
          parentId: 'b',
          connected: true,
        }),
      })
      expect(Object.keys(boneMap)).toHaveLength(3)
    })
  })

  describe('subdivideBone', () => {
    it('should subdivide target bone', () => {
      expect(
        target.subdivideBone(
          {
            a: getBone({
              id: 'a',
              name: 'name_a',
              head: { x: 1, y: 2 },
              tail: { x: 11, y: 22 },
              constraints: ['ik'],
              inheritRotation: false,
              inheritScale: false,
            }),
            c: getBone({ id: 'c' }),
          },
          'a',
          () => 'b'
        )
      ).toEqual({
        a: getBone({
          id: 'a',
          name: 'name_a',
          head: { x: 1, y: 2 },
          tail: { x: 6, y: 12 },
          constraints: ['ik'],
          inheritRotation: false,
          inheritScale: false,
        }),
        b: getBone({
          id: 'b',
          name: 'name_a.001',
          head: { x: 6, y: 12 },
          tail: { x: 11, y: 22 },
          parentId: 'a',
          connected: true,
          constraints: [],
          inheritRotation: true,
          inheritScale: true,
        }),
      })
    })
    it('should immigrate children', () => {
      expect(
        target.subdivideBone(
          {
            a: getBone({ id: 'a', name: 'a' }),
            child: getBone({
              id: 'child',
              parentId: 'a',
            }),
          },
          'a',
          () => 'b'
        )
      ).toEqual({
        a: getBone({ id: 'a', name: 'a' }),
        b: getBone({
          id: 'b',
          name: 'a.001',
          parentId: 'a',
          connected: true,
        }),
        child: getBone({ id: 'child', parentId: 'b' }),
      })
    })
  })

  describe('getUpdatedBonesByDissolvingBones', () => {
    it('should return bones to dissolve the target', () => {
      const boneMap = {
        a: getBone({
          id: 'a',
        }),
        b: getBone({
          id: 'b',
          parentId: 'a',
        }),
        c: getBone({
          id: 'c',
          parentId: 'b',
          constraints: ['ik'],
        }),
      }
      const constraintMap = {
        ik: getConstraint({
          id: 'ik',
          type: 'IK',
          option: getOptionByType('IK', { targetId: 'b' }),
        }),
      }
      const ret = target.getUpdatedBonesByDissolvingBones(
        boneMap,
        constraintMap,
        ['b']
      )
      expect(ret).toEqual({
        bones: {
          c: getBone({
            id: 'c',
            parentId: 'a',
            constraints: ['ik'],
          }),
        },
        constraints: {},
      })
    })
  })

  describe('getUpdatedBonesByDissolvingBone', () => {
    it('should return updated bones to replace refs of the dissolved target', () => {
      const boneMap = {
        a: getBone({
          id: 'a',
          tail: { x: 10, y: 20 },
        }),
        b: getBone({
          id: 'b',
          parentId: 'a',
          tail: { x: 100, y: 200 },
        }),
        c: getBone({
          id: 'c',
          parentId: 'b',
          constraints: ['ik'],
        }),
      }
      const constraintMap = {
        ik: getConstraint({
          id: 'ik',
          type: 'IK',
          option: getOptionByType('IK', { targetId: 'b' }),
        }),
      }
      const ret = target.getUpdatedBonesByDissolvingBone(
        boneMap,
        constraintMap,
        'b'
      )
      expect(ret).toEqual({
        bones: {
          c: getBone({
            id: 'c',
            parentId: 'a',
            constraints: ['ik'],
          }),
        },
        constraints: {
          ik: getConstraint({
            id: 'ik',
            type: 'IK',
            option: getOptionByType('IK', { targetId: 'a' }),
          }),
        },
      })
    })
    it('should clear parent connection if the parent is dissolved and not have self parent', () => {
      const boneMap = {
        b: getBone({
          id: 'b',
        }),
        c: getBone({
          id: 'c',
          parentId: 'b',
          connected: true,
        }),
      }
      const ret = target.getUpdatedBonesByDissolvingBone(boneMap, {}, 'b')
      expect(ret.bones).toEqual({
        c: getBone({
          id: 'c',
          parentId: '',
          connected: false,
        }),
      })
    })
    it('should let connected head move to a tail of new parent', () => {
      const boneMap = {
        a: getBone({
          id: 'a',
          tail: { x: 10, y: 20 },
        }),
        b: getBone({
          id: 'b',
          parentId: 'a',
          tail: { x: 100, y: 200 },
        }),
        c: getBone({
          id: 'c',
          parentId: 'b',
          connected: true,
          head: { x: 100, y: 200 },
        }),
        d: getBone({
          id: 'd',
          parentId: 'b',
          connected: false,
          head: { x: 100, y: 200 },
        }),
      }
      const ret = target.getUpdatedBonesByDissolvingBone(boneMap, {}, 'b')
      expect(ret.bones).toEqual({
        c: getBone({
          id: 'c',
          parentId: 'a',
          connected: true,
          head: { x: 10, y: 20 },
        }),
        d: getBone({
          id: 'd',
          parentId: 'a',
          connected: false,
          head: { x: 100, y: 200 },
        }),
      })
    })
  })

  describe('sortBoneBySize', () => {
    it('should sort bones by size', () => {
      expect(
        target.sortBoneBySize([
          getBone({ id: 'a', tail: { x: 1, y: 1 } }),
          getBone({ id: 'b', tail: { x: 2, y: 2 } }),
          getBone({ id: 'c', tail: { x: 2, y: 1 } }),
        ])
      ).toEqual([
        getBone({ id: 'b', tail: { x: 2, y: 2 } }),
        getBone({ id: 'c', tail: { x: 2, y: 1 } }),
        getBone({ id: 'a', tail: { x: 1, y: 1 } }),
      ])
    })
  })

  describe('getShiftClickedBoneState', () => {
    describe('when head and tail are clicked', () => {
      it('should clear all if head and tail are selected', () => {
        expect(
          target.getShiftClickedBoneState(
            { head: true, tail: true },
            { head: true, tail: true }
          )
        ).toEqual({})
      })
      it('should select all if either head and tail are selected', () => {
        expect(
          target.getShiftClickedBoneState(
            { tail: true },
            { head: true, tail: true }
          )
        ).toEqual({ head: true, tail: true })
      })
    })
    describe('when only head is clicked', () => {
      it('should clear head if head is selected', () => {
        expect(
          target.getShiftClickedBoneState(
            { head: true, tail: true },
            { head: true }
          )
        ).toEqual({ tail: true })
      })
      it('should select head if head is not selected', () => {
        expect(
          target.getShiftClickedBoneState({ tail: true }, { head: true })
        ).toEqual({ head: true, tail: true })
      })
    })
    describe('when only tail is clicked', () => {
      it('should clear tail if tail is selected', () => {
        expect(
          target.getShiftClickedBoneState(
            { head: true, tail: true },
            { tail: true }
          )
        ).toEqual({ head: true })
      })
      it('should select tail if tail is not selected', () => {
        expect(
          target.getShiftClickedBoneState({ head: true }, { tail: true })
        ).toEqual({ head: true, tail: true })
      })
    })
  })

  describe('getWorldToLocalTranslateFn', () => {
    it('should return a function to convert the vec from world to local space', () => {
      const fn1 = target.getWorldToLocalTranslateFn(
        getBone({
          tail: { x: 0, y: 1 },
        }),
        getTransform()
      )
      assertVec(fn1({ x: 1, y: 0 }), { x: 1, y: 0 })
      assertVec(fn1({ x: 0, y: 1 }), { x: 0, y: 1 })

      const fn2 = target.getWorldToLocalTranslateFn(
        getBone({
          tail: { x: -1, y: 0 },
        }),
        getTransform()
      )
      assertVec(fn2({ x: 1, y: 0 }), { x: 0, y: -1 })
      assertVec(fn2({ x: 0, y: 1 }), { x: 1, y: 0 })

      const fn3 = target.getWorldToLocalTranslateFn(
        getBone({
          tail: { x: 0, y: 1 },
        }),
        getTransform({ rotate: 90 })
      )
      assertVec(fn3({ x: 1, y: 0 }), { x: 0, y: -1 })
      assertVec(fn3({ x: 0, y: 1 }), { x: 1, y: 0 })
    })
    it('parentSpace can be omitted', () => {
      const fn = target.getWorldToLocalTranslateFn(
        getBone({
          tail: { x: 0, y: 1 },
        })
      )
      assertVec(fn({ x: 1, y: 0 }), { x: 1, y: 0 })
    })
  })
})
