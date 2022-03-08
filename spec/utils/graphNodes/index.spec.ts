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
  GraphNodeBreakVector2,
  GraphNodeMakeVector2,
  GraphNodeScaler,
  GraphNodeOutputMap,
  GraphNodeGetObject,
  GraphNodeCloneObject,
  GraphNodeSetTransform,
  GRAPH_VALUE_TYPE,
} from '/@/models/graphNode'
import {
  compute,
  getInputFromIds,
  resolveNode,
  resolveAllNodes,
  validateNode,
  validateAllNodes,
  validateConnection,
  resetInput,
  duplicateNodes,
  createGraphNode,
  getInput,
  deleteAndDisconnectNodes,
  getNodeEdgeTypes,
  updateInputConnection,
  getAllCircularRefIds,
  getAllEdgeConnectionInfo,
  getEdgeChainGroupAt,
  cleanEdgeGenericsGroupAt,
  getOutputType,
  getNodeErrors,
  cleanAllEdgeGenerics,
  getUpdatedNodeMapToDisconnectNodeInput,
  getInputTypes,
  createDefaultUnitValueForGenerics,
  getDataTypeAndValue,
  updateDataField,
  getGraphNodeModule,
  isUniqueEssentialNodeForCustomGraph,
  getUpdatedNodeMapToChangeNodeStruct,
  isInterfaceChanged,
  completeNodeMap,
} from '../../../src/utils/graphNodes/index'
import { getTransform } from '/@/models'
import { UNIT_VALUE_TYPES } from '/@/utils/graphNodes/core'

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
      expect(resolveAllNodes(getGraphNodeModule, context, nodes)).toEqual({
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
      expect(resolveAllNodes(getGraphNodeModule, context, nodes)).toEqual({
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
      expect(
        resolveNode(getGraphNodeModule, context, nodes, {}, 'make_vector2')
      ).toEqual({
        scaler1: { value: 1 },
        scaler2: { value: 10 },
        make_vector2: { vector2: { x: 1, y: 10 } },
      })
    })
    it('should ignore the circular connections', () => {
      expect(
        resolveNode(
          getGraphNodeModule,
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
      ).toEqual({
        make_vector2: { vector2: { x: 0, y: 0 } },
        break_vector2: { x: 0, y: 0 },
      })
    })
    it('should use the value if input references is invalid', () => {
      expect(
        resolveNode(
          getGraphNodeModule,
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

  describe('getAllCircularRefIds', () => {
    it('should be able to get circular ref ids', () => {
      const map = getAllCircularRefIds({
        ...nodes,
        cir_a: {
          id: 'cir_a',
          type: 'make_vector2',
          data: {},
          inputs: {
            x: { from: { id: 'cir_b', key: 'value' }, value: 0 },
            y: { from: { id: 'cir_b', key: 'value' }, value: 0 },
          },
          position: { x: 0, y: 0 },
        },
        cir_b: {
          id: 'cir_b',
          type: 'break_vector2',
          data: {},
          inputs: {
            vector2: {
              from: { id: 'cir_a', key: 'vector2' },
              value: { x: 0, y: 0 },
            },
          },
          position: { x: 0, y: 0 },
        },
      })
      expect(map).toEqual({ cir_a: true, cir_b: true })
    })
  })

  describe('compute', () => {
    it('scaler', () => {
      expect(compute(getGraphNodeModule, context, {}, nodes.scaler1)).toEqual({
        value: 1,
      })
    })
    it('make_vector2', () => {
      const ret: GraphNodeOutputMap = {}
      ret[nodes.scaler1.id] = compute(
        getGraphNodeModule,
        context,
        ret,
        nodes.scaler1
      )
      ret[nodes.scaler2.id] = compute(
        getGraphNodeModule,
        context,
        ret,
        nodes.scaler2
      )
      expect(
        compute(getGraphNodeModule, context, ret, nodes.make_vector2)
      ).toEqual({
        vector2: { x: 1, y: 10 },
      })
    })
    it('break_vector2', () => {
      const ret: GraphNodeOutputMap = {
        make_vector2: { vector2: { x: 1, y: 10 } },
      }
      expect(
        compute(getGraphNodeModule, context, ret, nodes.break_vector2)
      ).toEqual({
        x: 1,
        y: 10,
      })
    })
    it('should use default input value if the connection is invalid', () => {
      expect(
        compute(
          getGraphNodeModule,
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
    it('should return validated map of all nodes', () => {
      expect(
        validateAllNodes(getGraphNodeModule, {
          a: createGraphNode('make_vector2', { id: 'a' }),
          b: createGraphNode('make_vector2', { id: 'b' }),
        })
      ).toEqual({
        a: { x: true, y: true },
        b: { x: true, y: true },
      })
    })
  })

  describe('validateNode', () => {
    describe('should return validated map of inputs', () => {
      it('not connected => true', () => {
        expect(
          validateNode(
            getGraphNodeModule,
            {
              a: createGraphNode('make_vector2', {
                id: 'a',
                inputs: { x: {} },
              }),
            },
            'a'
          )
        ).toEqual({ x: true, y: true })
      })
      it('connected node not found => false', () => {
        expect(
          validateNode(
            getGraphNodeModule,
            {
              a: createGraphNode('make_vector2', {
                id: 'a',
                inputs: { x: { from: { id: 'b', key: 'value' } } },
              }),
            },
            'a'
          )
        ).toEqual({ x: false, y: true })
      })
      it('invalid connected type => false', () => {
        expect(
          validateNode(
            getGraphNodeModule,
            {
              a: createGraphNode('multi_scaler', {
                id: 'a',
                inputs: {
                  a: { from: { id: 'c', key: 'vector2' } },
                  b: { from: { id: 'b', key: 'value' } },
                },
              }),
              b: createGraphNode('scaler', { id: 'b' }),
              c: createGraphNode('make_vector2', { id: 'c' }),
            },
            'a'
          )
        ).toEqual({ a: false, b: true })
      })
      it('consider generics interface', () => {
        expect(
          validateNode(
            getGraphNodeModule,
            {
              a: createGraphNode('add_generics', {
                id: 'a',
                inputs: {
                  a: {
                    from: { id: 'b', key: 'value' },
                    genericsType: UNIT_VALUE_TYPES.TEXT,
                  },
                  b: {
                    from: { id: 'b', key: 'value' },
                    genericsType: UNIT_VALUE_TYPES.SCALER,
                  },
                },
              }),
              b: createGraphNode('add_generics', {
                id: 'b',
                inputs: {
                  a: {
                    from: { id: 'c', key: 'value' },
                    genericsType: UNIT_VALUE_TYPES.SCALER,
                  },
                  b: {
                    from: { id: 'c', key: 'value' },
                    genericsType: UNIT_VALUE_TYPES.SCALER,
                  },
                },
              }),
            },
            'a'
          )
        ).toEqual({ a: false, b: true })
      })
    })
  })

  describe('validateConnection', () => {
    it('should return true if the input and the output are valid combination', () => {
      expect(
        validateConnection(
          getGraphNodeModule,
          { node: createGraphNode('break_vector2'), key: 'y' },
          { node: createGraphNode('make_vector2'), key: 'x' }
        )
      ).toBe(true)
    })
    it('should return false if the input and the output are invalid combination', () => {
      expect(
        validateConnection(
          getGraphNodeModule,
          { node: createGraphNode('make_vector2'), key: 'vector2' },
          { node: createGraphNode('make_vector2'), key: 'x' }
        )
      ).toBe(false)
    })

    describe('generics', () => {
      it('should return true if the some edge have generics types', () => {
        expect(
          validateConnection(
            getGraphNodeModule,
            { node: createGraphNode('break_vector2'), key: 'y' },
            { node: createGraphNode('switch_generics'), key: 'if_true' }
          )
        ).toBe(true)
      })
      it('should return true if the generics types are defined and have valid connection', () => {
        expect(
          validateConnection(
            getGraphNodeModule,
            { node: createGraphNode('break_vector2'), key: 'y' },
            {
              node: createGraphNode('switch_generics', {
                inputs: {
                  if_true: {
                    value: 2,
                    genericsType: UNIT_VALUE_TYPES.SCALER,
                  },
                },
              }),
              key: 'if_true',
            }
          )
        ).toBe(true)
        expect(
          validateConnection(
            getGraphNodeModule,
            {
              node: createGraphNode('switch_generics', {
                inputs: {
                  if_true: {
                    value: 0,
                    genericsType: UNIT_VALUE_TYPES.VECTOR2,
                  },
                },
              }),
              key: 'value',
            },
            { node: createGraphNode('break_vector2'), key: 'vector2' }
          )
        ).toBe(true)
      })
      it('should return false if the generics types are defined and have invalid connection', () => {
        expect(
          validateConnection(
            getGraphNodeModule,
            { node: createGraphNode('break_vector2'), key: 'y' },
            {
              node: createGraphNode('switch_generics', {
                inputs: {
                  if_true: {
                    value: { x: 0, y: 1 },
                    genericsType: UNIT_VALUE_TYPES.VECTOR2,
                  },
                },
              }),
              key: 'if_true',
            }
          )
        ).toBe(false)
        expect(
          validateConnection(
            getGraphNodeModule,
            {
              node: createGraphNode('switch_generics', {
                inputs: {
                  if_true: {
                    value: 0,
                    genericsType: UNIT_VALUE_TYPES.SCALER,
                  },
                },
              }),
              key: 'value',
            },
            { node: createGraphNode('break_vector2'), key: 'vector2' }
          )
        ).toBe(false)
      })
    })
  })

  describe('resetInput', () => {
    it('should return default input data', () => {
      expect(
        resetInput(
          getGraphNodeModule('make_vector2').struct,
          createGraphNode('make_vector2', {
            inputs: { x: { from: { id: 'a', key: 'b' } } },
          }),
          'x'
        )
      ).toEqual(
        createGraphNode('make_vector2', {
          inputs: { x: { value: 0 } },
        })
      )
    })
    it('should keep generics if it is confirmed', () => {
      expect(
        resetInput(
          getGraphNodeModule('switch_generics').struct,
          createGraphNode('switch_generics', {
            inputs: {
              if_true: {
                from: { id: 'a', key: 'b' },
                genericsType: UNIT_VALUE_TYPES.SCALER,
              },
              if_false: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
              },
            },
          }),
          'if_true'
        )
      ).toEqual(
        createGraphNode('switch_generics', {
          inputs: {
            if_true: {
              value: undefined,
              genericsType: UNIT_VALUE_TYPES.SCALER,
            },
            if_false: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
            },
          },
        })
      )
    })
    it('should delete the input if its struct is not found', () => {
      expect(
        resetInput(
          getGraphNodeModule('make_vector2').struct,
          createGraphNode('make_vector2', {
            inputs: { unknown: { from: { id: 'a', key: 'b' } } } as any,
          }),
          'unknown'
        )
      ).toEqual(createGraphNode('make_vector2'))
    })
  })

  describe('duplicateNodes', () => {
    it('should duplicate and immigrate target nodes', () => {
      expect(
        duplicateNodes(
          getGraphNodeModule,
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
          {},
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
    it('should clean generics', () => {
      expect(
        duplicateNodes(
          getGraphNodeModule,
          {
            a: createGraphNode('switch_generics', {
              id: 'a',
              inputs: {
                if_true: {
                  genericsType: UNIT_VALUE_TYPES.SCALER,
                },
                if_false: {
                  genericsType: UNIT_VALUE_TYPES.SCALER,
                },
              },
            }),
            c: createGraphNode('switch_generics', {
              id: 'c',
              inputs: {
                if_true: {
                  from: { id: 'b', key: 'x' },
                  genericsType: UNIT_VALUE_TYPES.SCALER,
                },
                if_false: {
                  genericsType: UNIT_VALUE_TYPES.SCALER,
                },
              },
            }),
          },
          {
            b: createGraphNode('break_vector2', { id: 'b' }),
          },
          (n) => `d_${n.id}`
        )
      ).toEqual({
        d_a: createGraphNode('switch_generics', { id: 'd_a' }),
        d_c: createGraphNode('switch_generics', {
          id: 'd_c',
          inputs: {
            if_true: {
              from: { id: 'b', key: 'x' },
              genericsType: UNIT_VALUE_TYPES.SCALER,
            },
            if_false: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
            },
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

  describe('isUniqueEssentialNodeForCustomGraph', () => {
    it('should return true if the node is unique and essential for the custom graph', () => {
      expect(isUniqueEssentialNodeForCustomGraph('custom_begin_input')).toBe(
        true
      )
      expect(isUniqueEssentialNodeForCustomGraph('custom_begin_output')).toBe(
        true
      )
      expect(isUniqueEssentialNodeForCustomGraph('custom_input')).toBe(false)
    })
  })

  describe('deleteAndDisconnectNodes', () => {
    it('should delete nodes and their connections', () => {
      const ret = deleteAndDisconnectNodes(
        getGraphNodeModule,
        [
          createGraphNode('scaler', { id: 'a' }),
          createGraphNode('scaler', { id: 'b' }),
          createGraphNode('make_vector2', {
            id: 'c',
            inputs: {
              x: { from: { id: 'a', key: 'value' } },
              y: { from: { id: 'b', key: 'value' } },
            },
          }),
        ],
        { a: true }
      )

      expect(ret.nodes).toEqual([
        createGraphNode('scaler', { id: 'b' }),
        createGraphNode('make_vector2', {
          id: 'c',
          inputs: {
            x: { value: 0 },
            y: { from: { id: 'b', key: 'value' } },
          },
        }),
      ])
      expect(ret.updatedIds).toEqual({ c: true })
    })
    it('should not delete essential nodes', () => {
      const ret = deleteAndDisconnectNodes(
        getGraphNodeModule,
        [
          createGraphNode('custom_begin_input', { id: 'a' }),
          createGraphNode('custom_begin_output', { id: 'b' }),
        ],
        { a: true, b: true }
      )

      expect(ret.nodes).toEqual([
        createGraphNode('custom_begin_input', { id: 'a' }),
        createGraphNode('custom_begin_output', { id: 'b' }),
      ])
      expect(ret.updatedIds).toEqual({})
    })
  })

  describe('getNodeEdgeTypes', () => {
    it('should return the edge types of the target node', () => {
      expect(
        getNodeEdgeTypes(
          getGraphNodeModule,
          createGraphNode('make_vector2', {})
        )
      ).toEqual({
        inputs: {
          x: UNIT_VALUE_TYPES.SCALER,
          y: UNIT_VALUE_TYPES.SCALER,
        },
        outputs: {
          vector2: UNIT_VALUE_TYPES.VECTOR2,
        },
      })

      expect(
        getNodeEdgeTypes(
          getGraphNodeModule,
          createGraphNode('switch_generics', {
            inputs: {
              if_true: { value: 1, genericsType: UNIT_VALUE_TYPES.SCALER },
            },
          })
        )
      ).toEqual({
        inputs: {
          condition: UNIT_VALUE_TYPES.BOOLEAN,
          if_true: UNIT_VALUE_TYPES.SCALER,
          if_false: UNIT_VALUE_TYPES.GENERICS,
        },
        outputs: {
          value: UNIT_VALUE_TYPES.SCALER,
        },
      })

      expect(
        getNodeEdgeTypes(
          getGraphNodeModule,
          createGraphNode('switch_generics', {})
        )
      ).toEqual({
        inputs: {
          condition: UNIT_VALUE_TYPES.BOOLEAN,
          if_true: UNIT_VALUE_TYPES.GENERICS,
          if_false: UNIT_VALUE_TYPES.GENERICS,
        },
        outputs: {
          value: UNIT_VALUE_TYPES.GENERICS,
        },
      })
    })
  })

  describe('updateInputConnection', () => {
    it('should return updated node to be connected to', () => {
      expect(
        updateInputConnection(
          { node: createGraphNode('scaler', { id: 'a' }), key: 'value' },
          { node: createGraphNode('make_vector2'), key: 'y' }
        )
      ).toEqual(
        createGraphNode('make_vector2', {
          inputs: {
            y: {
              from: { id: 'a', key: 'value' },
            },
          },
        })
      )
    })
    it('should return undefined if the connection is needless to be updated', () => {
      expect(
        updateInputConnection(
          { node: createGraphNode('scaler', { id: 'a' }), key: 'value' },
          {
            node: createGraphNode('make_vector2', {
              inputs: { y: { from: { id: 'a', key: 'value' } } },
            }),
            key: 'y',
          }
        )
      ).toEqual(undefined)
    })
    it('should return undefined if the connection is recursive', () => {
      const node = createGraphNode('add_generics', {
        id: 'a',
      })
      expect(
        updateInputConnection(
          { node: node, key: 'value' },
          { node: node, key: 'a' }
        )
      ).toEqual(undefined)
    })
  })

  describe('getAllEdgeConnectionInfo', () => {
    it('should return all edge connection info', () => {
      expect(
        getAllEdgeConnectionInfo({
          a: createGraphNode('make_vector2', {
            id: 'a',
            inputs: {
              y: { from: { id: 'b', key: 'x' } },
            },
          }),
          b: createGraphNode('break_vector2', {
            id: 'b',
            inputs: {
              vector2: { from: { id: 'c', key: 'vector2' } },
            },
          }),
          c: createGraphNode('make_vector2', {
            id: 'c',
          }),
          e: createGraphNode('break_vector2', {
            id: 'e',
            inputs: {
              vector2: { from: { id: 'c', key: 'vector2' } },
            },
          }),
        })
      ).toEqual({
        a: {
          inputs: {
            y: { id: 'b', key: 'x' },
          },
          outputs: {},
        },
        b: {
          inputs: {
            vector2: { id: 'c', key: 'vector2' },
          },
          outputs: {
            x: [{ id: 'a', key: 'y' }],
          },
        },
        c: {
          inputs: {},
          outputs: {
            vector2: [
              { id: 'b', key: 'vector2' },
              { id: 'e', key: 'vector2' },
            ],
          },
        },
        e: {
          inputs: {
            vector2: { id: 'c', key: 'vector2' },
          },
          outputs: {},
        },
      })
    })
  })

  describe('getEdgeChainGroupAt', () => {
    it('should return edge chain group at the item', () => {
      const nodeMap = {
        a: createGraphNode('switch_generics', {
          id: 'a',
          inputs: { if_false: { from: { id: 'c', key: 'value' } } },
        }),
        b: createGraphNode('make_vector2', {
          id: 'b',
          inputs: { x: { from: { id: 'a', key: 'value' } } },
        }),
        c: createGraphNode('switch_generics', { id: 'c' }),
      }

      expect(
        getEdgeChainGroupAt(
          getGraphNodeModule,
          nodeMap,
          getAllEdgeConnectionInfo(nodeMap),
          {
            id: 'a',
            key: 'if_true',
          }
        )
      ).toEqual([
        { id: 'a', key: 'if_true' },
        { id: 'a', key: 'if_false' },
        { id: 'a', key: 'value', output: true },
        { id: 'c', key: 'if_true' },
        { id: 'c', key: 'if_false' },
        { id: 'c', key: 'value', output: true },
        { id: 'b', key: 'x', type: UNIT_VALUE_TYPES.SCALER },
      ])
    })
    it('should be able to handle Circular refs', () => {
      const nodeMap = {
        a: createGraphNode('switch_generics', {
          id: 'a',
          inputs: { if_false: { from: { id: 'c', key: 'value' } } },
        }),
        b: createGraphNode('switch_generics', {
          id: 'b',
          inputs: { if_true: { from: { id: 'a', key: 'value' } } },
        }),
        c: createGraphNode('switch_generics', {
          id: 'c',
          inputs: { if_false: { from: { id: 'b', key: 'value' } } },
        }),
      }

      expect(
        getEdgeChainGroupAt(
          getGraphNodeModule,
          nodeMap,
          getAllEdgeConnectionInfo(nodeMap),
          {
            id: 'a',
            key: 'if_true',
          }
        )
      ).toEqual([
        { id: 'a', key: 'if_true' },
        { id: 'a', key: 'if_false' },
        { id: 'a', key: 'value', output: true },
        { id: 'c', key: 'if_true' },
        { id: 'c', key: 'if_false' },
        { id: 'c', key: 'value', output: true },
        { id: 'b', key: 'if_true' },
        { id: 'b', key: 'if_false' },
        { id: 'b', key: 'value', output: true },
      ])
    })
  })

  describe('createDefaultUnitValueForGenerics', () => {
    it('should return default value for each type', () => {
      expect(
        createDefaultUnitValueForGenerics(GRAPH_VALUE_TYPE.SCALER)
      ).toEqual(0)
      expect(
        createDefaultUnitValueForGenerics(GRAPH_VALUE_TYPE.VECTOR2)
      ).toEqual({ x: 0, y: 0 })

      // should cover all types
      Object.values(GRAPH_VALUE_TYPE).forEach((type) => {
        expect(() => createDefaultUnitValueForGenerics(type)).not.toThrow()
      })
    })
  })

  describe('cleanEdgeGenericsGroupAt', () => {
    it('should clean edge generics group at the item', () => {
      const nodeMap = {
        a: createGraphNode('switch_generics', {
          id: 'a',
          inputs: {
            if_false: {
              from: { id: 'c', key: 'value' },
            },
          },
        }),
        b: createGraphNode('make_vector2', {
          id: 'b',
          inputs: { x: { from: { id: 'a', key: 'value' } } },
        }),
        c: createGraphNode('switch_generics', { id: 'c' }),
      }

      expect(
        cleanEdgeGenericsGroupAt(getGraphNodeModule, nodeMap, {
          id: 'a',
          key: 'if_true',
        })
      ).toEqual({
        a: createGraphNode('switch_generics', {
          id: 'a',
          inputs: {
            if_true: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
            if_false: {
              from: { id: 'c', key: 'value' },
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
          },
        }),
        c: createGraphNode('switch_generics', {
          id: 'c',
          inputs: {
            if_true: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
            if_false: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
          },
        }),
      })
    })
    it('should clean edge generics group at the item having no generics types', () => {
      const nodeMap = {
        a: createGraphNode('switch_generics', {
          id: 'a',
          inputs: {
            if_false: {
              from: { id: 'c', key: 'value' },
            },
          },
        }),
        b: createGraphNode('make_vector2', {
          id: 'b',
          inputs: { x: { from: { id: 'a', key: 'value' } } },
        }),
        c: createGraphNode('switch_generics', { id: 'c' }),
      }

      expect(
        cleanEdgeGenericsGroupAt(getGraphNodeModule, nodeMap, {
          id: 'b',
          key: 'x',
        })
      ).toEqual({
        a: createGraphNode('switch_generics', {
          id: 'a',
          inputs: {
            if_true: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
            if_false: {
              from: { id: 'c', key: 'value' },
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
          },
        }),
        c: createGraphNode('switch_generics', {
          id: 'c',
          inputs: {
            if_true: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
            if_false: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
          },
        }),
      })
    })
    it('should reset generics if tha chain does not have any resolved types', () => {
      const nodeMap = {
        a: createGraphNode('switch_generics', {
          id: 'a',
          inputs: {
            if_false: {
              from: { id: 'c', key: 'value' },
              genericsType: UNIT_VALUE_TYPES.SCALER,
            },
          },
        }),
        c: createGraphNode('switch_generics', {
          id: 'c',
          inputs: {
            if_true: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
            },
          },
        }),
      }

      expect(
        cleanEdgeGenericsGroupAt(getGraphNodeModule, nodeMap, {
          id: 'a',
          key: 'if_true',
        })
      ).toEqual({
        a: createGraphNode('switch_generics', {
          id: 'a',
          inputs: {
            if_false: {
              from: { id: 'c', key: 'value' },
            },
          },
        }),
        c: createGraphNode('switch_generics', {
          id: 'c',
        }),
      })
    })
    it('should be able to handle Circular refs', () => {
      const nodeMap = {
        a: createGraphNode('switch_generics', {
          id: 'a',
          inputs: { if_false: { from: { id: 'c', key: 'value' } } },
        }),
        b: createGraphNode('switch_generics', {
          id: 'b',
          inputs: { if_true: { from: { id: 'a', key: 'value' } } },
        }),
        c: createGraphNode('switch_generics', {
          id: 'c',
          inputs: { if_false: { from: { id: 'b', key: 'value' } } },
        }),
      }

      expect(
        cleanEdgeGenericsGroupAt(getGraphNodeModule, nodeMap, {
          id: 'a',
          key: 'if_true',
        })
      ).toEqual({})
    })

    describe('other cases', () => {
      it('should clean the target', () => {
        expect(
          cleanEdgeGenericsGroupAt(
            getGraphNodeModule,
            {
              a: createGraphNode('switch_generics', {
                id: 'a',
                inputs: {
                  if_true: { from: { id: 'b', key: 'x' } },
                },
              }),
              b: createGraphNode('break_vector2', { id: 'b' }),
              c: createGraphNode('make_vector2', { id: 'c' }),
            },
            { id: 'a', key: 'if_true' }
          )
        ).toEqual({
          a: createGraphNode('switch_generics', {
            id: 'a',
            inputs: {
              if_true: {
                from: { id: 'b', key: 'x' },
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
              if_false: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
            },
          }),
        })
      })
      it('should clean the input nodes connected with the target', () => {
        expect(
          cleanEdgeGenericsGroupAt(
            getGraphNodeModule,
            {
              a: createGraphNode('switch_generics', {
                id: 'a',
                inputs: {
                  if_true: { from: { id: 'b', key: 'x' } },
                  if_false: { from: { id: 'd', key: 'value' } },
                },
              }),
              b: createGraphNode('break_vector2', { id: 'b' }),
              d: createGraphNode('switch_generics', { id: 'd' }),
            },
            { id: 'a', key: 'if_true' }
          )
        ).toEqual({
          a: createGraphNode('switch_generics', {
            id: 'a',
            inputs: {
              if_true: {
                from: { id: 'b', key: 'x' },
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
              if_false: {
                from: { id: 'd', key: 'value' },
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
            },
          }),
          d: createGraphNode('switch_generics', {
            id: 'd',
            inputs: {
              if_true: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
              if_false: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
            },
          }),
        })
      })
      it('should clean the other nodes connected with the target', () => {
        expect(
          cleanEdgeGenericsGroupAt(
            getGraphNodeModule,
            {
              a: createGraphNode('switch_generics', {
                id: 'a',
                inputs: {
                  if_true: { from: { id: 'b', key: 'x' } },
                  if_false: { from: { id: 'd', key: 'value' } },
                },
              }),
              b: createGraphNode('break_vector2', { id: 'b' }),
              c: createGraphNode('switch_generics', {
                id: 'c',
                inputs: {
                  if_true: { from: { id: 'a', key: 'value' } },
                },
              }),
              d: createGraphNode('switch_generics', {
                id: 'd',
                inputs: {
                  if_true: { from: { id: 'e', key: 'value' } },
                },
              }),
              e: createGraphNode('switch_generics', { id: 'e' }),
              f: createGraphNode('switch_generics', {
                id: 'f',
                inputs: {
                  if_true: { from: { id: 'e', key: 'value' } },
                },
              }),
            },
            { id: 'a', key: 'if_true' }
          )
        ).toEqual({
          a: createGraphNode('switch_generics', {
            id: 'a',
            inputs: {
              if_true: {
                from: { id: 'b', key: 'x' },
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
              if_false: {
                from: { id: 'd', key: 'value' },
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
            },
          }),
          c: createGraphNode('switch_generics', {
            id: 'c',
            inputs: {
              if_true: {
                from: { id: 'a', key: 'value' },
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
              if_false: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
            },
          }),
          d: createGraphNode('switch_generics', {
            id: 'd',
            inputs: {
              if_true: {
                from: { id: 'e', key: 'value' },
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
              if_false: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
            },
          }),
          e: createGraphNode('switch_generics', {
            id: 'e',
            inputs: {
              if_true: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
              if_false: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
            },
          }),
          f: createGraphNode('switch_generics', {
            id: 'f',
            inputs: {
              if_true: {
                from: { id: 'e', key: 'value' },
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
              if_false: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
            },
          }),
        })
      })
      it('should clean the input nodes connected with the target without generics', () => {
        expect(
          cleanEdgeGenericsGroupAt(
            getGraphNodeModule,
            {
              a: createGraphNode('switch_generics', { id: 'a' }),
              b: createGraphNode('make_vector2', {
                id: 'b',
                inputs: { x: { from: { id: 'a', key: 'value' } } },
              }),
            },
            { id: 'b', key: 'x' }
          )
        ).toEqual({
          a: createGraphNode('switch_generics', {
            id: 'a',
            inputs: {
              if_true: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
              if_false: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
            },
          }),
        })
      })
      it('should resolve generics in data field', () => {
        expect(
          cleanEdgeGenericsGroupAt(
            getGraphNodeModule,
            {
              a: createGraphNode('custom_input', {
                id: 'a',
                data: {
                  name: '',
                  default: { value: '' },
                },
              }),
              c: createGraphNode('make_vector2', {
                id: 'c',
                inputs: {
                  x: { from: { id: 'a', key: 'value' } },
                  y: { value: 0 },
                },
              }),
            },
            { id: 'c', key: 'x' }
          )
        ).toEqual({
          a: createGraphNode('custom_input', {
            id: 'a',
            data: {
              name: '',
              default: { value: 0, genericsType: UNIT_VALUE_TYPES.SCALER },
            },
          }),
        })
      })
    })
  })

  describe('cleanAllEdgeGenerics', () => {
    describe('should clean all edge generics', () => {
      it('one node', () => {
        expect(
          cleanAllEdgeGenerics(getGraphNodeModule, {
            a: createGraphNode('switch_generics', {
              id: 'a',
              inputs: {
                if_true: {
                  genericsType: UNIT_VALUE_TYPES.SCALER,
                },
                if_false: {
                  genericsType: UNIT_VALUE_TYPES.SCALER,
                },
              },
            }),
          })
        ).toEqual({
          a: createGraphNode('switch_generics', { id: 'a' }),
        })
      })
      it('resolve generics if edge chains include fixed types', () => {
        expect(
          cleanAllEdgeGenerics(getGraphNodeModule, {
            a: createGraphNode('switch_generics', {
              id: 'a',
              inputs: {
                if_true: { from: { id: 'b', key: 'x' } },
                if_false: { from: { id: 'd', key: 'value' } },
              },
            }),
            b: createGraphNode('break_vector2', { id: 'b' }),
          })
        ).toEqual({
          a: createGraphNode('switch_generics', {
            id: 'a',
            inputs: {
              if_true: {
                from: { id: 'b', key: 'x' },
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
              if_false: {
                from: { id: 'd', key: 'value' },
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
            },
          }),
        })
      })
      it('some independent chains', () => {
        expect(
          cleanAllEdgeGenerics(getGraphNodeModule, {
            a: createGraphNode('switch_generics', {
              id: 'a',
              inputs: {
                if_true: { from: { id: 'b', key: 'x' } },
              },
            }),
            b: createGraphNode('break_vector2', { id: 'b' }),
            c: createGraphNode('switch_generics', { id: 'c' }),
            d: createGraphNode('switch_generics', {
              id: 'd',
              inputs: {
                if_true: {
                  from: { id: 'c', key: 'value' },
                  genericsType: UNIT_VALUE_TYPES.SCALER,
                },
              },
            }),
          })
        ).toEqual({
          a: createGraphNode('switch_generics', {
            id: 'a',
            inputs: {
              if_true: {
                from: { id: 'b', key: 'x' },
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
              if_false: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
            },
          }),
          d: createGraphNode('switch_generics', {
            id: 'd',
            inputs: {
              if_true: {
                from: { id: 'c', key: 'value' },
              },
            },
          }),
        })
      })
      it('resolve generics of data', () => {
        expect(
          cleanAllEdgeGenerics(getGraphNodeModule, {
            a: createGraphNode('custom_input', {
              id: 'a',
              inputs: {
                input: {
                  genericsType: UNIT_VALUE_TYPES.SCALER,
                },
              },
            }),
            b: createGraphNode('make_vector2', {
              id: 'b',
              inputs: {
                x: { from: { id: 'a', key: 'value' } },
                y: { value: 2 },
              },
            }),
          })
        ).toEqual({
          a: createGraphNode('custom_input', {
            id: 'a',
            data: {
              name: 'input',
              default: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
                value: 0,
              },
            },
            inputs: {
              input: {
                genericsType: UNIT_VALUE_TYPES.SCALER,
              },
            },
          }),
        })
      })
      it('clean generics of data', () => {
        expect(
          cleanAllEdgeGenerics(getGraphNodeModule, {
            a: createGraphNode('custom_input', {
              id: 'a',
              data: {
                name: 'input',
                default: {
                  genericsType: UNIT_VALUE_TYPES.SCALER,
                  value: 0,
                },
              },
            }),
          })
        ).toEqual({
          a: createGraphNode('custom_input', {
            id: 'a',
          }),
        })
      })
    })
  })

  describe('updateDataField', () => {
    describe('should update data field', () => {
      it('when the field has generics type', () => {
        expect(
          updateDataField(
            getGraphNodeModule,
            'custom_input',
            'default',
            {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
            10
          )
        ).toEqual({
          genericsType: UNIT_VALUE_TYPES.SCALER,
          value: 10,
        })
      })
      it('when the field does not have generics type', () => {
        expect(
          updateDataField(getGraphNodeModule, 'scaler', 'value', 1, 10)
        ).toEqual(10)
      })
    })
  })

  describe('getDataTypeAndValue', () => {
    describe('should return type and value of the data field', () => {
      it('when the node has decided generics data', () => {
        expect(
          getDataTypeAndValue(
            getGraphNodeModule,
            createGraphNode('custom_input', {
              data: {
                name: '',
                default: { genericsType: UNIT_VALUE_TYPES.SCALER, value: 10 },
              },
            }),
            'default'
          )
        ).toEqual({
          type: UNIT_VALUE_TYPES.SCALER,
          value: 10,
        })
      })
      it('when the node has undecided generics data', () => {
        expect(
          getDataTypeAndValue(
            getGraphNodeModule,
            createGraphNode('custom_input', {
              data: {
                name: '',
                default: {},
              },
            }),
            'default'
          )
        ).toEqual({ type: UNIT_VALUE_TYPES.GENERICS, value: undefined })
      })
      it('when the node does not have generics data', () => {
        expect(
          getDataTypeAndValue(
            getGraphNodeModule,
            createGraphNode('scaler', {
              data: { value: 20 },
            }),
            'value'
          )
        ).toEqual({
          type: UNIT_VALUE_TYPES.SCALER,
          value: 20,
        })
      })
    })
  })

  describe('getInputTypes', () => {
    it('should return input types map', () => {
      expect(
        getInputTypes(
          getGraphNodeModule('multi_scaler').struct,
          createGraphNode('multi_scaler', {})
        )
      ).toEqual({
        a: UNIT_VALUE_TYPES.SCALER,
        b: UNIT_VALUE_TYPES.SCALER,
      })
    })
    it('should consider generics type', () => {
      expect(
        getInputTypes(
          getGraphNodeModule('multi_scaler').struct,
          createGraphNode('add_generics', {
            inputs: {
              a: { genericsType: UNIT_VALUE_TYPES.SCALER },
              b: { genericsType: UNIT_VALUE_TYPES.SCALER },
            },
          })
        )
      ).toEqual({ a: UNIT_VALUE_TYPES.SCALER, b: UNIT_VALUE_TYPES.SCALER })
    })
  })

  describe('getOutputType', () => {
    it('should return the output type of the node', () => {
      expect(
        getOutputType(
          getGraphNodeModule('switch_generics').struct,
          createGraphNode('switch_generics'),
          'value'
        )
      ).toEqual(UNIT_VALUE_TYPES.GENERICS)
      expect(
        getOutputType(
          getGraphNodeModule('switch_generics').struct,
          createGraphNode('switch_generics', {
            inputs: {
              if_true: { genericsType: UNIT_VALUE_TYPES.SCALER },
            },
          }),
          'value'
        )
      ).toEqual(UNIT_VALUE_TYPES.SCALER)
      expect(
        getOutputType(
          getGraphNodeModule('make_vector2').struct,
          createGraphNode('make_vector2'),
          'vector2'
        )
      ).toEqual(UNIT_VALUE_TYPES.VECTOR2)
    })
  })

  describe('getNodeErrors', () => {
    it('should return errors map for nodes with some errors', () => {
      expect(
        getNodeErrors(getGraphNodeModule, {
          a: createGraphNode('add_generics', {
            id: 'a',
            inputs: { a: { genericsType: UNIT_VALUE_TYPES.OBJECT } },
          }),
          b: createGraphNode('sin', {
            id: 'b',
            inputs: { rotate: { from: { id: 'c', key: 'value' } } },
          }),
          c: createGraphNode('cos', {
            id: 'c',
            inputs: { rotate: { from: { id: 'b', key: 'value' } } },
          }),
          d: createGraphNode('cos', {
            id: 'd',
            inputs: { rotate: { from: { id: 'z', key: 'value' } } },
          }),
        })
      ).toEqual({
        a: ['invalid type to operate'],
        b: ['Circular connection is found'],
        c: ['Circular connection is found'],
        d: ['Invalid input: rotate'],
      })
    })
  })

  describe('getUpdatedNodeMapToDisconnectNodeInput', () => {
    describe('should return updated node map to disconnect the input', () => {
      it('when an input type is generics', () => {
        expect(
          getUpdatedNodeMapToDisconnectNodeInput(
            getGraphNodeModule,
            {
              a: createGraphNode('add_generics', {
                id: 'a',
                inputs: {
                  a: {
                    from: { id: 'b', key: 'vector2' },
                    genericsType: UNIT_VALUE_TYPES.OBJECT,
                  },
                },
              }),
              b: createGraphNode('make_vector2', { id: 'b' }),
            },
            'a',
            'a'
          )
        ).toEqual({
          a: createGraphNode('add_generics', { id: 'a' }),
        })
      })
      it('when an output type is generics', () => {
        expect(
          getUpdatedNodeMapToDisconnectNodeInput(
            getGraphNodeModule,
            {
              a: createGraphNode('add_generics', {
                id: 'a',
                inputs: {
                  a: { genericsType: UNIT_VALUE_TYPES.SCALER },
                  b: { genericsType: UNIT_VALUE_TYPES.SCALER },
                },
              }),
              b: createGraphNode('make_vector2', {
                id: 'b',
                inputs: {
                  x: { from: { id: 'a', key: 'value' } },
                },
              }),
            },
            'b',
            'x'
          )
        ).toEqual({
          a: createGraphNode('add_generics', { id: 'a' }),
          b: createGraphNode('make_vector2', { id: 'b' }),
        })
      })
    })
  })

  describe('getUpdatedNodeMapToChangeNodeStruct', () => {
    const nodeMap = {
      a: createGraphNode('multi_scaler', { id: 'a' }),
      b: createGraphNode('make_vector2', {
        id: 'b',
        inputs: { x: { from: { id: 'a', key: 'value' } } },
      }),
      c: createGraphNode('break_vector2', {
        id: 'c',
        inputs: { vector2: { from: { id: 'b', key: 'vector2' } } },
      }),
    }

    it('should do nothing if no interface changed', () => {
      expect(
        getUpdatedNodeMapToChangeNodeStruct(
          getGraphNodeModule,
          nodeMap,
          'make_vector2',
          getGraphNodeModule('make_vector2').struct
        )
      ).toEqual({})
    })
    it('should disconnect input edges with updated interface', () => {
      expect(
        getUpdatedNodeMapToChangeNodeStruct(
          getGraphNodeModule,
          nodeMap,
          'make_vector2',
          {
            ...getGraphNodeModule('make_vector2').struct,
            inputs: {
              ...getGraphNodeModule('make_vector2').struct.inputs,
              x: { type: UNIT_VALUE_TYPES.BOOLEAN, default: false },
            },
          }
        )
      ).toEqual({
        b: createGraphNode('make_vector2', {
          id: 'b',
          inputs: { x: { value: false } as any },
        }),
      })
    })
    it('should disconnect and delete input edges with updated interface', () => {
      expect(
        getUpdatedNodeMapToChangeNodeStruct(
          getGraphNodeModule,
          nodeMap,
          'make_vector2',
          {
            ...getGraphNodeModule('make_vector2').struct,
            inputs: {
              y: getGraphNodeModule('make_vector2').struct.inputs.y,
            },
          }
        )
      ).toEqual({
        b: {
          ...createGraphNode('make_vector2', { id: 'b' }),
          inputs: { y: createGraphNode('make_vector2', { id: 'b' }).inputs.y },
        },
      })
    })
    it('should disconnect output edges with updated interface', () => {
      expect(
        getUpdatedNodeMapToChangeNodeStruct(
          getGraphNodeModule,
          nodeMap,
          'make_vector2',
          {
            ...getGraphNodeModule('make_vector2').struct,
            outputs: {
              ...getGraphNodeModule('make_vector2').struct.outputs,
              vector2: UNIT_VALUE_TYPES.BOOLEAN,
            },
          }
        )
      ).toEqual({
        c: createGraphNode('break_vector2', { id: 'c' }),
      })
    })
  })

  describe('isInterfaceChanged', () => {
    it('should return false if nothing is changed', () => {
      expect(
        isInterfaceChanged(
          {
            inputs: {
              a: { type: UNIT_VALUE_TYPES.SCALER, default: 10 },
            },
            outputs: {
              aa: UNIT_VALUE_TYPES.SCALER,
            },
          },
          {
            inputs: {
              a: { type: UNIT_VALUE_TYPES.SCALER, default: 10 },
            },
            outputs: {
              aa: UNIT_VALUE_TYPES.SCALER,
            },
          }
        )
      ).toEqual(false)
    })
    it('should return true if some inputs are changed', () => {
      expect(
        isInterfaceChanged(
          {
            inputs: {
              a: { type: UNIT_VALUE_TYPES.SCALER, default: 10 },
              b: { type: UNIT_VALUE_TYPES.OBJECT, default: 'obj' },
              c: { type: UNIT_VALUE_TYPES.BOOLEAN, default: false },
            },
            outputs: {
              aa: UNIT_VALUE_TYPES.SCALER,
            },
          },
          {
            inputs: {
              a: { type: UNIT_VALUE_TYPES.TEXT, default: 'txt' },
              c: { type: UNIT_VALUE_TYPES.BOOLEAN, default: true },
            },
            outputs: {
              aa: UNIT_VALUE_TYPES.SCALER,
            },
          }
        )
      ).toEqual(true)
    })
    it('should return true if some outputs are changed', () => {
      expect(
        isInterfaceChanged(
          {
            inputs: {
              a: { type: UNIT_VALUE_TYPES.SCALER, default: 10 },
            },
            outputs: {
              aa: UNIT_VALUE_TYPES.SCALER,
              bb: UNIT_VALUE_TYPES.OBJECT,
              cc: UNIT_VALUE_TYPES.VECTOR2,
            },
          },
          {
            inputs: {
              a: { type: UNIT_VALUE_TYPES.SCALER, default: 10 },
            },
            outputs: {
              aa: UNIT_VALUE_TYPES.SCALER,
              bb: UNIT_VALUE_TYPES.VECTOR2,
            },
          }
        )
      ).toEqual(true)
    })
  })

  describe('completeNodeMap', () => {
    it('should complete input fields if each node has some errors', () => {
      expect(
        completeNodeMap(
          getGraphNodeModule,
          {
            a: createGraphNode('make_vector2', {
              id: 'a',
              inputs: {
                x: { from: { id: 'b', key: 'value' } },
                y: { value: 10 },
              },
            }),
            b: createGraphNode('make_transform', { id: 'b' }),
          },
          { a: true }
        )
      ).toEqual({
        a: createGraphNode('make_vector2', {
          id: 'a',
          inputs: { x: { value: 0 }, y: { value: 10 } },
        }),
        b: createGraphNode('make_transform', { id: 'b' }),
      })
    })
  })
})
