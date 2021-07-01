import type {
  GraphNodeBreakVector2,
  GraphNodeMakeVector2,
  GraphNodeScaler,
  GraphNodeOutputMap,
  GraphNodeGetObject,
  GraphNodeCloneObject,
  GraphNodeSetTransform,
} from '/@/models/graphNode'
import {
  compute,
  getInputFromIds,
  resolveNode,
  resolveAllNodes,
  validateInput,
  validateNode,
  validateAllNodes,
  validateConnection,
  resetInput,
  duplicateNodes,
  createGraphNode,
  getInput,
} from '../../../src/utils/graphNodes/index'
import { getTransform } from '/@/models'

const context = {
  setTransform() {},
} as any

describe('src/utils/graphNodes/index.ts', () => {
  const nodes = {
    scaler1: {
      id: 'scaler1',
      type: 'scaler',
      data: { value: 1 },
      inputs: {},
      position: { x: 0, y: 0 },
    } as GraphNodeScaler,
    scaler2: {
      id: 'scaler2',
      type: 'scaler',
      data: { value: 10 },
      inputs: {},
      position: { x: 0, y: 0 },
    } as GraphNodeScaler,
    make_vector2: {
      id: 'make_vector2',
      type: 'make_vector2',
      data: { x: 0, y: 0 },
      inputs: {
        x: { from: { id: 'scaler1', key: 'value' }, value: 0 },
        y: { from: { id: 'scaler2', key: 'value' }, value: 0 },
      },
      position: { x: 0, y: 0 },
    } as GraphNodeMakeVector2,
    break_vector2: {
      id: 'break_vector2',
      type: 'break_vector2',
      data: {},
      inputs: {
        vector2: {
          from: { id: 'make_vector2', key: 'vector2' },
          value: { x: 0, y: 0 },
        },
      },
      position: { x: 0, y: 0 },
    } as GraphNodeBreakVector2,
  } as const

  describe('resolveAllNodes', () => {
    it('make_vector2', () => {
      expect(resolveAllNodes(context, nodes)).toEqual({
        scaler1: { value: 1 },
        scaler2: { value: 10 },
        make_vector2: { vector2: { x: 1, y: 10 } },
        break_vector2: { x: 1, y: 10 },
      })
    })
    it('clone_object', () => {
      const context = {
        setTransform() {},
        cloneObject: jest.fn().mockReturnValue('b'),
      } as any
      const nodes = {
        get_object: {
          id: 'get_object',
          type: 'get_object',
          data: { object: 'a' },
          inputs: {},
          position: { x: 0, y: 0 },
        } as GraphNodeGetObject,
        clone_object: {
          id: 'clone_object',
          type: 'clone_object',
          data: {},
          inputs: {
            object: {
              from: { id: 'get_object', key: 'object' },
            },
          },
          position: { x: 0, y: 0 },
        } as GraphNodeCloneObject,
        set_transform: {
          id: 'set_transform',
          type: 'set_transform',
          data: {},
          inputs: {
            object: { from: { id: 'clone_object', key: 'clone' } },
            transform: { value: getTransform() },
          },
          position: { x: 0, y: 0 },
        } as GraphNodeSetTransform,
      } as const
      expect(resolveAllNodes(context, nodes)).toEqual({
        get_object: { object: 'a' },
        clone_object: { origin: 'a', clone: 'b' },
        set_transform: { object: 'b' },
      })
      // should avoid duplicated calculations to use hash of outputs
      expect(context.cloneObject).toHaveReturnedTimes(1)
    })
  })

  describe('resolveNode', () => {
    it('make_vector2', () => {
      expect(resolveNode(context, nodes, {}, 'make_vector2')).toEqual({
        scaler1: { value: 1 },
        scaler2: { value: 10 },
        make_vector2: { vector2: { x: 1, y: 10 } },
      })
    })
    it('should throw an error if circular references are founded', () => {
      expect(() =>
        resolveNode(
          context,
          {
            make_vector2: {
              id: 'make_vector2',
              type: 'make_vector2',
              data: { x: 0, y: 0 },
              inputs: {
                x: { from: { id: 'break_vector2', key: 'x' }, value: 0 },
                y: { from: { id: 'break_vector2', key: 'y' }, value: 0 },
              },
              position: { x: 0, y: 0 },
            } as GraphNodeMakeVector2,
            break_vector2: {
              id: 'break_vector2',
              type: 'break_vector2',
              data: {},
              inputs: {
                vector2: {
                  from: { id: 'make_vector2', key: 'vector2' },
                  value: { x: 0, y: 0 },
                },
              },
              position: { x: 0, y: 0 },
            } as GraphNodeBreakVector2,
          },
          {},
          'make_vector2'
        )
      ).toThrow('Failed to resolve: circular references are founded')
    })
    it('should use the value if input references is invalid', () => {
      expect(
        resolveNode(
          context,
          {
            make_vector2: {
              id: 'make_vector2',
              type: 'make_vector2',
              data: { x: 0, y: 0 },
              inputs: {
                x: { from: { id: 'scaler1', key: 'value' }, value: 2 },
                y: { from: { id: 'scaler2', key: 'value' }, value: 4 },
              },
              position: { x: 0, y: 0 },
            } as GraphNodeMakeVector2,
          },
          {},
          'make_vector2'
        )
      ).toEqual({
        make_vector2: { vector2: { x: 2, y: 4 } },
      })
    })
  })

  describe('compute', () => {
    it('scaler', () => {
      expect(compute(context, {}, nodes.scaler1)).toEqual({ value: 1 })
    })
    it('make_vector2', () => {
      const ret: GraphNodeOutputMap = {}
      ret[nodes.scaler1.id] = compute(context, ret, nodes.scaler1)
      ret[nodes.scaler2.id] = compute(context, ret, nodes.scaler2)
      expect(compute(context, ret, nodes.make_vector2)).toEqual({
        vector2: { x: 1, y: 10 },
      })
    })
    it('break_vector2', () => {
      const ret: GraphNodeOutputMap = {
        make_vector2: { vector2: { x: 1, y: 10 } },
      }
      expect(compute(context, ret, nodes.break_vector2)).toEqual({
        x: 1,
        y: 10,
      })
    })
    it('should use default input value if the connection is invalid', () => {
      expect(
        compute(
          context,
          {},
          {
            id: 'break_vector2',
            type: 'break_vector2',
            data: {},
            inputs: {
              vector2: {
                from: { id: 'make_vector2', key: 'vector2' },
              },
            },
            position: { x: 0, y: 0 },
          }
        )
      ).toEqual({ x: 0, y: 0 })
    })
  })

  describe('getInput', () => {
    it('should return default input value if it is not connected', () => {
      expect(getInput({}, { a: { value: 1 } }, 'a')).toEqual(1)
    })
    it('should return connected output value if it is connected', () => {
      expect(
        getInput({ b: { c: 1 } }, { a: { from: { id: 'b', key: 'c' } } }, 'a')
      ).toEqual(1)
    })
    it('should return default input value if connected node are not found', () => {
      expect(
        getInput({}, { a: { value: 1, from: { id: 'b', key: 'c' } } }, 'a')
      ).toEqual(1)
      expect(getInput({}, { a: { from: { id: 'b', key: 'c' } } }, 'a')).toEqual(
        undefined
      )
    })
    it('should return default input value if the key of connected node are not found', () => {
      expect(
        getInput(
          { b: {} },
          { a: { value: 1, from: { id: 'b', key: 'c' } } },
          'a'
        )
      ).toEqual(1)
    })
  })

  describe('getInputFromIds', () => {
    it('scaler', () => {
      expect(
        getInputFromIds({
          a: { from: { id: '1', key: '' } },
          b: { from: { id: '2', key: '' } },
          c: { value: 0 },
        }).sort()
      ).toEqual(['1', '2'])
    })
  })

  describe('validateAllNodes', () => {
    const node = {
      id: 'node',
      type: 'make_vector2',
      data: {},
      inputs: { x: { value: 1 }, y: {} },
      position: { x: 0, y: 0 },
    } as const

    it('should return validated map of all nodes', () => {
      expect(validateAllNodes({ node, node2: node })).toEqual({
        node: { x: true, y: false },
        node2: { x: true, y: false },
      })
    })
  })

  describe('validateNode', () => {
    const node = {
      id: 'node',
      type: 'make_vector2',
      data: {},
      inputs: { x: { value: 1 }, y: {} },
      position: { x: 0, y: 0 },
    } as const

    it('should return validated map of inputs', () => {
      expect(validateNode({ node }, 'node')).toEqual({ x: true, y: false })
    })
  })

  describe('validateInput', () => {
    const node = {
      id: 'node',
      type: 'scaler',
      data: { value: 1 },
      inputs: {},
      position: { x: 0, y: 0 },
    } as const

    it('should return true if value is defined', () => {
      expect(
        validateInput({ node }, { x: { value: 0 }, y: { value: 0 } }, 'x')
      ).toBe(true)
    })
    it('should return true if from relation is valid', () => {
      expect(
        validateInput(
          { node },
          { x: { from: { id: 'node', key: 'value' } }, y: { value: 0 } },
          'x'
        )
      ).toBe(true)
    })
    it('should return false if from relation is invalid', () => {
      expect(validateInput({ node }, { x: {}, y: { value: 0 } }, 'x')).toBe(
        false
      )
      expect(
        validateInput(
          { node },
          { x: { from: { id: 'invalid', key: 'value' } }, y: { value: 0 } },
          'x'
        )
      ).toBe(false)
    })
  })

  describe('validateConnection', () => {
    it('should return true if the input and the output are valid combination', () => {
      expect(
        validateConnection(
          { type: 'break_vector2', key: 'y' },
          { type: 'make_vector2', key: 'x' }
        )
      ).toBe(true)
    })
    it('should return false if the input and the output are invalid combination', () => {
      expect(
        validateConnection(
          { type: 'make_vector2', key: 'vector2' },
          { type: 'make_vector2', key: 'x' }
        )
      ).toBe(false)
    })
  })

  describe('resetInput', () => {
    it('should return default input data', () => {
      expect(resetInput('make_vector2', 'x')).toEqual({ value: 0 })
      expect(resetInput('set_transform', 'transform')).toEqual({
        value: getTransform(),
      })
    })
  })

  describe('duplicateNodes', () => {
    it('should duplicate and immigrate target nodes', () => {
      expect(
        duplicateNodes(
          {
            a: createGraphNode('make_vector2', {
              id: 'a',
              inputs: {
                x: { from: { id: 'b', key: 'x' } },
                y: { from: { id: 'b', key: 'y' } },
              },
            }),
            b: createGraphNode('break_vector2', { id: 'b' }),
            c: createGraphNode('make_vector2', {
              id: 'c',
              inputs: {
                x: { from: { id: 'd', key: 'x' } },
                y: { from: { id: 'd', key: 'y' } },
              },
            }),
          },
          (n) => `d_${n.id}`
        )
      ).toEqual({
        d_a: createGraphNode('make_vector2', {
          id: 'd_a',
          // should immigrate ids of duplicate nodes
          inputs: {
            x: { from: { id: 'd_b', key: 'x' } },
            y: { from: { id: 'd_b', key: 'y' } },
          },
        }),
        d_b: createGraphNode('break_vector2', { id: 'd_b' }),
        d_c: createGraphNode('make_vector2', {
          id: 'd_c',
          // should not immigrate ids of unduplicate nodes
          inputs: {
            x: { from: { id: 'd', key: 'x' } },
            y: { from: { id: 'd', key: 'y' } },
          },
        }),
      })
    })
  })

  describe('createGraphNode', () => {
    it('should override partial inputs', () => {
      expect(
        createGraphNode('make_vector2', {
          inputs: { x: { from: { id: 'a', key: 'b' } } } as any,
        })
      ).toEqual({
        ...createGraphNode('make_vector2'),
        inputs: {
          x: { from: { id: 'a', key: 'b' } },
          y: { value: 0 },
        },
      })
    })
  })
})
