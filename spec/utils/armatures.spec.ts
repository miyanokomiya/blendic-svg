import * as target from '../../src/utils/armatures'
import { getArmature, getBorn, getTransform } from '../../src/models/index'

describe('utils/armatures', () => {
  describe('extrudeFromParent', () => {
    const parent = getBorn({ id: 'parent', tail: { x: 1, y: 2 } })

    it("fromHead: false => extrude from parent's tail", () => {
      expect({ ...target.extrudeFromParent(parent), id: '1' }).toEqual(
        getBorn({
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
        getBorn({
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
        getBorn({
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
    const parent = getBorn({ id: 'parent', tail: { x: 1, y: 2 } })

    it("connected: true => connect child's head to parent's tail", () => {
      const child = getBorn({
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
      const child = getBorn({
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

  describe('selectBorn', () => {
    const parent = getBorn({ id: 'parent' })
    const selecgted = getBorn({
      id: 'selecgted',
      parentId: 'parent',
      connected: true,
    })
    const brother = getBorn({
      id: 'brother',
      parentId: 'parent',
      connected: true,
    })
    const unconnectedBrother = getBorn({
      id: 'unconnectedBrother',
      parentId: 'parent',
      connected: false,
    })
    const child = getBorn({
      id: 'child',
      parentId: 'selecgted',
      connected: true,
    })
    const unconnectedChild = getBorn({
      id: 'unconnectedChild',
      parentId: 'selecgted',
      connected: false,
    })

    describe('head: true', () => {
      it("connected: true => also select parent's tail & brother's head", () => {
        expect(
          target.selectBorn(
            getArmature({
              borns: [parent, selecgted, brother, unconnectedBrother, child],
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
          target.selectBorn(
            getArmature({
              borns: [parent, { ...selecgted, connected: false }, child],
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
          target.selectBorn(
            getArmature({
              borns: [parent, selecgted, child, unconnectedChild],
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
      const parent = getBorn({ id: 'parent', tail: { x: 1, y: 2 } })
      const connected = getBorn({
        id: 'connected',
        parentId: 'parent',
        connected: true,
        head: { x: 10, y: 20 },
      })
      const unconnected = getBorn({
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
      const parent = getBorn({ id: 'parent', tail: { x: 1, y: 2 } })
      const connected = getBorn({
        id: 'connected',
        parentId: 'parent',
        connected: true,
        head: { x: 10, y: 20 },
      })
      const unconnected = getBorn({
        id: 'unconnected',
        parentId: 'parent',
        connected: true,
        head: { x: 1, y: 2 },
      })
      expect(
        target.updateConnections([parent, connected, unconnected])
      ).toEqual([parent, { ...connected, connected: false }, unconnected])
    })
    it('cannot find parent => set no parent', () => {
      const connected = getBorn({
        id: 'connected',
        parentId: 'parent',
        connected: true,
        head: { x: 10, y: 20 },
      })
      expect(target.updateConnections([connected])).toEqual([
        { ...connected, connected: false, parentId: '' },
      ])
    })
  })

  describe('updateBornName', () => {
    it("rename born's name, parentId", () => {
      const borns = [
        getBorn({ name: '1', parentId: '' }),
        getBorn({ name: '2', parentId: '1' }),
        getBorn({ name: '3', parentId: '2' }),
      ]
      expect(target.updateBornName(borns, '1', '10')).toEqual([
        getBorn({ name: '10', parentId: '' }),
        getBorn({ name: '2', parentId: '10' }),
        getBorn({ name: '3', parentId: '2' }),
      ])
    })
  })

  describe('getSelectedBornsBoundingOrigin', () => {
    it('retuns selected borns origin', () => {
      const bornMap = {
        1: getBorn({ id: '1', head: { x: 0, y: 1 }, tail: { x: 2, y: 3 } }),
        2: getBorn({ id: '2', head: { x: 10, y: 11 }, tail: { x: 12, y: 13 } }),
        3: getBorn({ id: '3', head: { x: 20, y: 21 }, tail: { x: 24, y: 25 } }),
        4: getBorn({
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
      expect(
        target.getSelectedBornsBoundingOrigin(bornMap, selectedState)
      ).toEqual({
        x: 12,
        y: 13,
      })
    })
  })

  describe('getSelectedBornsOrigin', () => {
    it('retuns selected borns origin', () => {
      const bornMap = {
        1: getBorn({ id: '1', head: { x: 0, y: 1 }, tail: { x: 2, y: 3 } }),
        2: getBorn({ id: '2', head: { x: 10, y: 11 }, tail: { x: 12, y: 13 } }),
        3: getBorn({ id: '3', head: { x: 20, y: 21 }, tail: { x: 24, y: 25 } }),
        4: getBorn({
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
      expect(target.getSelectedBornsOrigin(bornMap, selectedState)).toEqual({
        x: 9,
        y: 10,
      })
    })
  })

  describe('getPosedBornHeadsOrigin', () => {
    it('retuns selected borns origin', () => {
      const bornMap = {
        1: getBorn({ id: '1', head: { x: 0, y: 2 }, tail: { x: 2, y: 3 } }),
        2: getBorn({ id: '2', head: { x: 10, y: 12 }, tail: { x: 12, y: 13 } }),
        3: getBorn({ id: '3', head: { x: 5, y: 7 }, tail: { x: 24, y: 25 } }),
      }
      expect(target.getPosedBornHeadsOrigin(bornMap)).toEqual({
        x: 5,
        y: 7,
      })
    })
  })

  describe('getTree', () => {
    it('get nodes tree', () => {
      const bornMap = {
        a: { id: 'a', parentId: '' },
        aa: { id: 'aa', parentId: 'a' },
        aaa: { id: 'aaa', parentId: 'aa' },
        b: { id: 'b', parentId: '' },
      }
      expect(target.getTree(bornMap)).toEqual([
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
    it('get nodes tree', () => {
      const bornMap = {
        a: { id: 'a', parentId: '' },
        aa: { id: 'aa', parentId: 'a' },
        ab: { id: 'ab', parentId: 'a' },
      }
      expect(target.getTree(bornMap)).toEqual([
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
  })

  describe('extendTransform', () => {
    it('scale', () => {
      expect(target.extendTransform(getBorn(), getBorn())).toEqual(getBorn())
      expect(
        target.extendTransform(
          getBorn({
            head: { x: 1, y: 1 },
            transform: getTransform({
              scale: { x: 2, y: 3 },
            }),
          }),
          getBorn({
            head: { x: 2, y: 3 },
            transform: getTransform({
              scale: { x: 2, y: 3 },
              rotate: 45,
            }),
          })
        )
      ).toEqual(
        getBorn({
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
      expect(target.extendTransform(getBorn(), getBorn())).toEqual(getBorn())
      expect(
        target.extendTransform(
          getBorn({
            head: { x: 1, y: 1 },
            transform: getTransform({
              rotate: 90,
            }),
          }),
          getBorn({
            head: { x: 2, y: 3 },
            transform: getTransform({
              rotate: 45,
            }),
          })
        )
      ).toEqual(
        getBorn({
          head: { x: 2, y: 3 },
          transform: getTransform({
            translate: { x: -3, y: -1 },
            rotate: 135,
          }),
        })
      )
    })
  })

  describe('getTransformedBornMap', () => {
    it('get transformed born map', () => {
      expect(
        target.getTransformedBornMap({
          a: getBorn({
            id: 'a',
            parentId: '',
            transform: getTransform({ rotate: 10 }),
          }),
          aa: getBorn({
            id: 'aa',
            parentId: 'a',
            transform: getTransform({ rotate: 20 }),
          }),
          aaa: getBorn({
            id: 'aaa',
            parentId: 'aa',
            transform: getTransform({ rotate: 30 }),
          }),
          b: getBorn({
            id: 'b',
            parentId: '',
            transform: getTransform({ rotate: 30 }),
          }),
        })
      ).toEqual({
        a: getBorn({
          id: 'a',
          parentId: '',
          transform: getTransform({ rotate: 10 }),
        }),
        aa: getBorn({
          id: 'aa',
          parentId: 'a',
          transform: getTransform({ rotate: 30 }),
        }),
        aaa: getBorn({
          id: 'aaa',
          parentId: 'aa',
          transform: getTransform({ rotate: 60 }),
        }),
        b: getBorn({
          id: 'b',
          parentId: '',
          transform: getTransform({ rotate: 30 }),
        }),
      })
    })
  })

  describe('getAnySelectedBorns', () => {
    it('get any selected borns', () => {
      expect(
        target.getAnySelectedBorns(
          {
            a: getBorn({
              id: 'a',
              parentId: '',
            }),
            aa: getBorn({
              id: 'aa',
              parentId: 'a',
            }),
            aaa: getBorn({
              id: 'aaa',
              parentId: 'aa',
            }),
            b: getBorn({
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
        aa: getBorn({
          id: 'aa',
          parentId: 'a',
        }),
        aaa: getBorn({
          id: 'aaa',
          parentId: 'aa',
        }),
        b: getBorn({
          id: 'b',
          parentId: '',
        }),
      })
    })
  })

  describe('getPoseSelectedBorns', () => {
    it('if parent is selected the children are ignored', () => {
      expect(
        target.getPoseSelectedBorns(
          {
            a: getBorn({
              id: 'a',
              parentId: '',
            }),
            aa: getBorn({
              id: 'aa',
              parentId: 'a',
            }),
            aaa: getBorn({
              id: 'aaa',
              parentId: 'aa',
            }),
            b: getBorn({
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
        aa: getBorn({
          id: 'aa',
          parentId: 'a',
        }),
        b: getBorn({
          id: 'b',
          parentId: '',
        }),
      })
    })
  })
})
