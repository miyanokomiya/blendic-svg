import * as target from '../../src/utils/armatures'
import { getArmature, getBone, getTransform } from '../../src/models/index'

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

    describe('head: true', () => {
      it("connected: true => also select parent's tail & brother's head", () => {
        expect(
          target.selectBone(
            getArmature({
              bones: [parent, selecgted, brother, unconnectedBrother, child],
            }),
            selecgted.id,
            { head: true, tail: false }
          )
        ).toEqual({
          parent: { tail: true },
          selecgted: { head: true, tail: false },
          brother: { head: true },
        })
      })
      it("connected: false => not select parent's tail", () => {
        expect(
          target.selectBone(
            getArmature({
              bones: [parent, { ...selecgted, connected: false }, child],
            }),
            selecgted.id,
            { head: true, tail: false }
          )
        ).toEqual({
          selecgted: { head: true, tail: false },
        })
      })
    })
    describe('tail: true', () => {
      it("also select connected children's head", () => {
        expect(
          target.selectBone(
            getArmature({
              bones: [parent, selecgted, child, unconnectedChild],
            }),
            selecgted.id,
            { head: false, tail: true }
          )
        ).toEqual({
          selecgted: { head: false, tail: true },
          child: { head: true },
        })
      })
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
      expect(target.fixConnections([parent, connected, unconnected])).toEqual([
        parent,
        { ...connected, head: { x: 1, y: 2 } },
        unconnected,
      ])
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
      expect(target.updateConnections([connected])).toEqual({
        connected: { connected: false, parentId: '' },
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
        2: { head: true, tail: false },
        3: { head: false, tail: true },
        4: { head: false, tail: false },
      }
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
        a: { id: 'a', parentId: '' },
        aa: { id: 'aa', parentId: 'a' },
        aaa: { id: 'aaa', parentId: 'aa' },
        b: { id: 'b', parentId: '' },
      }
      expect(target.getTree(boneMap)).toEqual([
        {
          id: 'a',
          parentId: '',
          children: [
            {
              id: 'aa',
              children: [{ id: 'aaa', children: [], parentId: 'aa' }],
              parentId: 'a',
            },
          ],
        },
        { id: 'b', children: [], parentId: '' },
      ])
    })
    it('get nodes tree: multi children', () => {
      const boneMap = {
        a: { id: 'a', parentId: '' },
        aa: { id: 'aa', parentId: 'a' },
        ab: { id: 'ab', parentId: 'a' },
      }
      expect(target.getTree(boneMap)).toEqual([
        {
          id: 'a',
          parentId: '',
          children: [
            { id: 'aa', children: [], parentId: 'a' },
            { id: 'ab', children: [], parentId: 'a' },
          ],
        },
      ])
    })
    it('ignore the parent does not exist', () => {
      const boneMap = {
        a: { id: 'a', parentId: '' },
        aa: { id: 'aa', parentId: 'a' },
        ab: { id: 'ab', parentId: 'b' },
      }
      expect(target.getTree(boneMap)).toEqual([
        {
          id: 'a',
          parentId: '',
          children: [{ id: 'aa', children: [], parentId: 'a' }],
        },
        { id: 'ab', children: [], parentId: 'b' },
      ])
    })
  })

  describe('extendTransform', () => {
    it('scale', () => {
      expect(target.extendTransform(getBone(), getBone())).toEqual(getBone())
      expect(
        target.extendTransform(
          getBone({
            head: { x: 1, y: 1 },
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
      ).toEqual(
        getBone({
          head: { x: 2, y: 3 },
          transform: getTransform({
            translate: { x: 1, y: 4 },
            scale: { x: 4, y: 9 },
            rotate: 45,
          }),
        })
      )
    })
    it('rotate', () => {
      expect(target.extendTransform(getBone(), getBone())).toEqual(getBone())
      expect(
        target.extendTransform(
          getBone({
            head: { x: 1, y: 1 },
            transform: getTransform({
              rotate: 90,
            }),
          }),
          getBone({
            head: { x: 2, y: 3 },
            transform: getTransform({
              rotate: 45,
            }),
          })
        )
      ).toEqual(
        getBone({
          head: { x: 2, y: 3 },
          transform: getTransform({
            translate: { x: -3, y: -1 },
            rotate: 135,
          }),
        })
      )
    })
  })

  describe('getTransformedBoneMap', () => {
    it('get transformed bone map', () => {
      expect(
        target.getTransformedBoneMap({
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
        })
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
    it('interpolate rotate', () => {
      const ret = target.interpolateTransform(
        getTransform({ rotate: 20 }),
        getTransform({ rotate: 30 }),
        0.2
      )
      expect(ret.rotate).toBeCloseTo(22)
    })
  })

  describe('duplicateBones', () => {
    it('duplicate bones with new ids & names, sorted by new name', () => {
      const ret = target.duplicateBones(
        {
          b: getBone({ id: 'b', name: 'b' }),
          a: getBone({ id: 'a', name: 'aa' }),
        },
        ['b', 'aa.001']
      )
      expect(ret.length).toBe(2)
      expect(ret[0].id).not.toBe('a')
      expect(ret[0].name).toBe('aa.002')
      expect(ret[1].id).not.toBe('b')
      expect(ret[1].name).toBe('b.001')
    })
    it('switch new parent if the parent is duplicated together', () => {
      const ret = target.duplicateBones(
        {
          a: getBone({ id: 'a', name: 'a' }),
          b: getBone({ id: 'b', name: 'b', parentId: 'a', connected: true }),
          c: getBone({ id: 'b', name: 'b', parentId: 'a', connected: false }),
        },
        ['b', 'a', 'c']
      )
      expect(ret.length).toBe(3)
      expect(ret[1].parentId).toBe(ret[0].id)
      expect(ret[1].connected).toBe(true)
      expect(ret[2].parentId).toBe(ret[0].id)
      expect(ret[2].connected).toBe(false)
    })
    it('unconnect current parent if the parent is not duplicated together', () => {
      const ret = target.duplicateBones(
        {
          b: getBone({ id: 'b', name: 'b', parentId: 'a', connected: true }),
        },
        ['b', 'a']
      )
      expect(ret.length).toBe(1)
      expect(ret[0].parentId).toBe('a')
      expect(ret[0].connected).toBe(false)
    })
  })
})
