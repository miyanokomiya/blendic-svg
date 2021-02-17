import * as target from '../../src/utils/armatures'
import { getArmature, getBorn, getTransform } from '../../src/models/index'

describe('utils/armatures', () => {
  describe('dissolveOrigin', () => {
    it('dissolve origin', () => {
      expect(
        target.dissolveOrigin(
          getTransform({
            origin: { x: 1, y: 2 },
          })
        )
      ).toEqual(
        getTransform({
          translate: { x: 0, y: 0 },
        })
      )
      expect(
        target.dissolveOrigin(
          getTransform({
            scale: { x: 2, y: 3 },
            origin: { x: 1, y: 2 },
          })
        )
      ).toEqual(
        getTransform({
          scale: { x: 2, y: 3 },
          translate: { x: -1, y: -4 },
        })
      )
      expect(
        target.dissolveOrigin(
          getTransform({
            rotate: 90,
            origin: { x: 1, y: 1 },
          })
        )
      ).toEqual(
        getTransform({
          rotate: 90,
          translate: { x: 2, y: 0 },
        })
      )
      expect(
        target.dissolveOrigin(
          getTransform({
            scale: { x: 2, y: 3 },
            rotate: 90,
            origin: { x: 1, y: 1 },
          })
        )
      ).toEqual(
        getTransform({
          scale: { x: 2, y: 3 },
          rotate: 90,
          translate: { x: 4, y: -1 },
        })
      )
    })
  })

  describe('convoluteTransforms', () => {
    it('convolute translate', () => {
      expect(
        target.convoluteTransforms([
          getTransform({
            translate: { x: 1, y: 2 },
          }),
          getTransform({
            translate: { x: 10, y: 20 },
          }),
        ])
      ).toEqual(
        getTransform({
          translate: { x: 11, y: 22 },
        })
      )
    })
    it('convolute scale', () => {
      expect(
        target.convoluteTransforms([
          getTransform({
            scale: { x: 2, y: 3 },
          }),
          getTransform({
            scale: { x: 10, y: 20 },
            origin: { x: 1, y: 1 },
          }),
        ])
      ).toEqual(
        getTransform({
          translate: { x: -9, y: -19 },
          scale: { x: 20, y: 60 },
        })
      )
      expect(
        target.convoluteTransforms([
          getTransform({
            scale: { x: 2, y: 3 },
            origin: { x: 1, y: 1 },
          }),
          getTransform({
            scale: { x: 10, y: 20 },
            origin: { x: 1, y: 1 },
          }),
        ])
      ).toEqual(
        getTransform({
          translate: { x: -19, y: -59 },
          scale: { x: 20, y: 60 },
          origin: { x: 0, y: 0 },
        })
      )
      expect(
        target.convoluteTransforms([
          getTransform({
            scale: { x: 2, y: 3 },
            origin: { x: 1, y: 1 },
          }),
          getTransform({
            scale: { x: 10, y: 20 },
            origin: { x: 1, y: 1 },
          }),
          getTransform({
            scale: { x: 2, y: 1 },
            origin: { x: 1, y: 1 },
          }),
        ])
      ).toEqual(
        getTransform({
          translate: { x: -39, y: -59 },
          scale: { x: 40, y: 60 },
          origin: { x: 0, y: 0 },
        })
      )
    })
    it('convolute rotate', () => {
      const c1 = target.convoluteTransforms([
        getTransform({
          translate: { x: 1, y: 0 },
        }),
        getTransform({
          rotate: 180,
          origin: { x: 1, y: 1 },
        }),
      ])
      expect(c1).toEqual(
        getTransform({
          translate: { x: 1, y: 2 },
          rotate: 180,
        })
      )
      const ret = target.applyTransform({ x: 3, y: 5 }, c1)
      const ex = target.applyTransform(
        { x: 3, y: 5 },
        getTransform({
          translate: { x: 1, y: 2 },
          rotate: 180,
        })
      )
      expect(ret.x).toBeCloseTo(ex.x)
      expect(ret.y).toBeCloseTo(ex.y)
    })
    it('convolute translate & rotate & scale', () => {
      const c1 = target.convoluteTransforms([
        getTransform({
          translate: { x: 1, y: 0 },
          rotate: 180,
          scale: { x: 2, y: 1 },
          origin: { x: 1, y: 1 },
        }),
      ])
      const ret = target.applyTransform({ x: 0, y: 0 }, c1)
      const ex = target.applyTransform(
        { x: 0, y: 0 },
        getTransform({
          translate: { x: 1, y: 0 },
          rotate: 180,
          scale: { x: 2, y: 1 },
          origin: { x: 1, y: 1 },
        })
      )
      expect(ret.x).toBeCloseTo(ex.x)
      expect(ret.y).toBeCloseTo(ex.y)
    })
    it('extra test', () => {
      const list = [
        getTransform({
          translate: { x: 1, y: 2 },
          rotate: 45,
          scale: { x: -2, y: -3 },
          origin: { x: -1, y: 1 },
        }),
        getTransform({
          translate: { x: 1, y: 2 },
          rotate: 180,
          scale: { x: -2, y: -3 },
          origin: { x: -1, y: 1 },
        }),
        //getTransform({
        //  translate: { x: 11, y: -21 },
        //  rotate: -45,
        //  scale: { x: -2, y: 3 },
        //  origin: { x: -1, y: 2 },
        //}),
        //getTransform({
        //  translate: { x: 11, y: -21 },
        //  rotate: -45,
        //  scale: { x: -2, y: 3 },
        //  origin: { x: -1, y: 2 },
        //}),
      ]
      const v = { x: -1, y: 3 }
      const ret = target.applyTransform(v, target.convoluteTransforms(list))
      const ex = list.reduce((p, t) => target.applyTransform(p, t), v)
      expect(ret.x).toBeCloseTo(ex.x)
      expect(ret.y).toBeCloseTo(ex.y)
    })
  })

  describe('applyTransform', () => {
    it('apply transform to vec', () => {
      const ret = target.applyTransform(
        { x: 1, y: 0 },
        target.convoluteTransforms([
          getTransform({ scale: { x: 2, y: 3 }, origin: { x: 1, y: 1 } }),
          getTransform({ rotate: 180, origin: { x: 1, y: 1 } }),
          getTransform({ translate: { x: 1, y: 2 } }),
        ])
      )
      const ex = target.applyTransform(
        { x: 1, y: 0 },
        getTransform({
          translate: { x: 1, y: 2 },
          rotate: 180,
          scale: { x: 2, y: 3 },
          origin: { x: 1, y: 1 },
        })
      )
      expect(ret.x).toBeCloseTo(ex.x)
      expect(ret.y).toBeCloseTo(ex.y)
    })
  })

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
})
