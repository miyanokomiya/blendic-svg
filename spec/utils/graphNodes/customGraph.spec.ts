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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { getCustomGraph } from '/@/models'
import { createGraphNode, getGraphNodeModule } from '/@/utils/graphNodes'
import { UNIT_VALUE_TYPES } from '/@/utils/graphNodes/core'
import {
  ajudstCustomGraphNodeLayout,
  ajudstCustomNodePosition,
  convertToCustomGraphInputInterface,
  convertToCustomGraphOutputInterface,
  createCustomNodeModule,
  getAllCustomGraphDependencies,
  getIndepenetCustomGraphIds,
  makeCustomGraphFromNodes,
  sortCustomGraphByDeps,
} from '/@/utils/graphNodes/customGraph'

describe('src/utils/graphNodes/customGraph.ts', () => {
  describe('createCustomNodeModule', () => {
    describe('inputs', () => {
      it('should craete inputs struct', () => {
        const beginInputNode = createGraphNode('custom_begin_input', {
          id: 'begin',
        })
        const inputNode0 = createGraphNode('custom_input', {
          id: 'input_0',
          data: {
            name: 'name_0',
            default: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 10,
            },
          },
          inputs: { input: { from: { id: 'begin', key: 'input' } } },
        })
        const inputNode1 = createGraphNode('custom_input', {
          id: 'input_1',
          data: { name: 'name_1', default: {} },
          inputs: { input: { from: { id: 'input_0', key: 'input' } } },
        })

        const { struct } = createCustomNodeModule(
          getGraphNodeModule,
          getCustomGraph({
            nodes: [beginInputNode.id, inputNode1.id, inputNode0.id],
          }),
          {
            [beginInputNode.id]: beginInputNode,
            [inputNode1.id]: inputNode1,
            [inputNode0.id]: inputNode0,
          }
        )

        expect(struct.inputs).toEqual({
          input_0: {
            label: 'name_0',
            type: UNIT_VALUE_TYPES.SCALER,
            default: 10,
          },
          input_1: {
            label: 'name_1',
            type: UNIT_VALUE_TYPES.GENERICS,
            default: undefined,
          },
        })
      })
      it('should ignore unconnected input nodes', () => {
        const beginInputNode = createGraphNode('custom_begin_input', {
          id: 'begin',
        })
        const inputNode0 = createGraphNode('custom_input', {
          id: 'input_0',
          data: { name: 'name_0', default: {} },
          inputs: { input: {} },
        })
        const inputNode1 = createGraphNode('custom_input', {
          id: 'input_1',
          data: { name: 'name_1', default: {} },
          inputs: { input: {} },
        })

        const { struct } = createCustomNodeModule(
          getGraphNodeModule,
          getCustomGraph({
            nodes: [beginInputNode.id, inputNode1.id, inputNode0.id],
          }),
          {
            [beginInputNode.id]: beginInputNode,
            [inputNode1.id]: inputNode1,
            [inputNode0.id]: inputNode0,
          }
        )

        expect(struct.inputs).toEqual({})
      })
    })

    describe('outputs', () => {
      it('should craete outputs struct', () => {
        const beginOutputNode = createGraphNode('custom_begin_output', {
          id: 'begin',
        })
        const outputNode0 = createGraphNode('custom_output', {
          id: 'output_0',
          data: { name: 'name_0' },
          inputs: {
            output: { from: { id: 'begin', key: 'output' } },
            value: {
              from: { id: 'begin', key: 'output' },
              genericsType: UNIT_VALUE_TYPES.SCALER,
            },
          },
        })
        const outputNode1 = createGraphNode('custom_output', {
          id: 'output_1',
          data: { name: 'name_1' },
          inputs: { output: { from: { id: 'output_0', key: 'output' } } },
        })

        const { struct } = createCustomNodeModule(
          getGraphNodeModule,
          getCustomGraph({
            nodes: [beginOutputNode.id, outputNode1.id, outputNode0.id],
          }),
          {
            [beginOutputNode.id]: beginOutputNode,
            [outputNode1.id]: outputNode1,
            [outputNode0.id]: outputNode0,
          }
        )

        expect(struct.outputs).toEqual({
          output_0: {
            ...UNIT_VALUE_TYPES.SCALER,
            label: 'name_0',
          },
          output_1: {
            ...UNIT_VALUE_TYPES.GENERICS,
            label: 'name_1',
          },
        })
      })
      it('should ignore unconnected output nodes', () => {
        const beginOutputNode = createGraphNode('custom_begin_output', {
          id: 'begin',
        })
        const outputNode0 = createGraphNode('custom_output', {
          id: 'output_0',
          data: { name: 'name_0' },
          inputs: { output: {} },
        })
        const outputNode1 = createGraphNode('custom_output', {
          id: 'output_1',
          data: { name: 'name_1' },
          inputs: { output: {} },
        })

        const { struct } = createCustomNodeModule(
          getGraphNodeModule,
          getCustomGraph({
            nodes: [beginOutputNode.id, outputNode1.id, outputNode0.id],
          }),
          {
            [beginOutputNode.id]: beginOutputNode,
            [outputNode1.id]: outputNode1,
            [outputNode0.id]: outputNode0,
          }
        )

        expect(struct.outputs).toEqual({})
      })
    })

    describe('computation', () => {
      it('should craete computation struct', () => {
        const beginInputNode = createGraphNode('custom_begin_input', {
          id: 'begin_input',
        })
        const inputNode0 = createGraphNode('custom_input', {
          id: 'input_0',
          data: {
            name: 'input_0',
            default: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 10,
            },
          },
          inputs: { input: { from: { id: 'begin_input', key: 'input' } } },
        })
        const beginOutputNode = createGraphNode('custom_begin_output', {
          id: 'begin_output',
        })
        const outputNode0 = createGraphNode('custom_output', {
          id: 'output_0',
          data: { name: 'name_0' },
          inputs: {
            output: { from: { id: 'begin_output', key: 'output' } },
            value: {
              from: { id: 'make_vector2', key: 'vector2' },
              genericsType: UNIT_VALUE_TYPES.SCALER,
            },
          },
        })

        const makeVector2Node = createGraphNode('make_vector2', {
          id: 'make_vector2',
          inputs: {
            x: { from: { id: 'input_0', key: 'value' } },
            y: { value: 20 },
          },
        })

        const { struct } = createCustomNodeModule(
          getGraphNodeModule,
          getCustomGraph({
            nodes: [
              beginInputNode.id,
              inputNode0.id,
              beginOutputNode.id,
              outputNode0.id,
              makeVector2Node.id,
            ],
          }),
          {
            [beginInputNode.id]: beginInputNode,
            [inputNode0.id]: inputNode0,
            [beginOutputNode.id]: beginOutputNode,
            [outputNode0.id]: outputNode0,
            [makeVector2Node.id]: makeVector2Node,
          }
        )

        const beginNamespace = (_: any, val: any) => val()

        expect(
          struct.computation(
            { input_0: 10 },
            { id: 'a' } as any,
            { beginNamespace } as any,
            getGraphNodeModule
          )
        ).toEqual({
          output_0: { x: 10, y: 20 },
        })
      })
    })

    describe('genericsChains', () => {
      it('should craete getOutputType and genericsChains', () => {
        const beginInputNode = createGraphNode('custom_begin_input', {
          id: 'begin_input',
        })
        const inputNode0 = createGraphNode('custom_input', {
          id: 'input_0',
          data: { name: 'name_0' },
          inputs: { input: { from: { id: beginInputNode.id, key: 'input' } } },
        })
        const inputNode1 = createGraphNode('custom_input', {
          id: 'input_1',
          data: { name: 'name_1' },
          inputs: { input: { from: { id: inputNode0.id, key: 'input' } } },
        })
        const inputNode2 = createGraphNode('custom_input', {
          id: 'input_2',
          data: { name: 'name_2' },
          inputs: { input: { from: { id: inputNode1.id, key: 'input' } } },
        })

        const beginOutputNode = createGraphNode('custom_begin_output', {
          id: 'begin_output',
        })
        const outputNode0 = createGraphNode('custom_output', {
          id: 'output_0',
          data: { name: 'name_0' },
          inputs: {
            output: { from: { id: beginOutputNode.id, key: 'output' } },
            value: { from: { id: inputNode0.id, key: 'value' } },
          },
        })
        const outputNode1 = createGraphNode('custom_output', {
          id: 'output_1',
          data: { name: 'name_1' },
          inputs: {
            output: { from: { id: outputNode0.id, key: 'output' } },
            value: { from: { id: inputNode1.id, key: 'value' } },
          },
        })
        const other = createGraphNode('add_generics', {
          id: 'other',
          inputs: {
            a: { from: { id: inputNode1.id, key: 'value' } },
          },
        })

        const { struct } = createCustomNodeModule(
          getGraphNodeModule,
          getCustomGraph({
            nodes: [
              beginInputNode.id,
              inputNode0.id,
              inputNode1.id,
              inputNode2.id,
              beginOutputNode.id,
              outputNode0.id,
              outputNode1.id,
              other.id,
            ],
          }),
          {
            [beginInputNode.id]: beginInputNode,
            [inputNode0.id]: inputNode0,
            [inputNode1.id]: inputNode1,
            [inputNode2.id]: inputNode2,
            [beginOutputNode.id]: beginOutputNode,
            [outputNode0.id]: outputNode0,
            [outputNode1.id]: outputNode1,
            [other.id]: other,
          }
        )

        expect(struct.genericsChains).toEqual([
          [{ key: 'input_0' }, { key: 'output_0', output: true }],
          [{ key: 'input_1' }, { key: 'output_1', output: true }],
          [{ key: 'input_2' }],
        ])

        const mockSelf = {
          inputs: {
            input_0: { genericsType: UNIT_VALUE_TYPES.SCALER },
            input_1: { genericsType: UNIT_VALUE_TYPES.VECTOR2 },
          },
        } as any
        expect(struct.getOutputType!(mockSelf, 'output_0')).toEqual(
          UNIT_VALUE_TYPES.SCALER
        )
        expect(struct.getOutputType!(mockSelf, 'output_1')).toEqual(
          UNIT_VALUE_TYPES.VECTOR2
        )
      })
    })
  })

  describe('getAllCustomGraphDependencies', () => {
    it('should return dependencies', () => {
      expect(
        getAllCustomGraphDependencies(
          {
            na: { type: 't_na' },
            nb: { type: 't_nb' },
            nc: { type: 'b' },
            nd: { type: 'c' },
          },
          [
            { id: 'a', nodes: ['na', 'nb', 'nc'] },
            { id: 'b', nodes: ['nd'] },
            { id: 'c', nodes: [] },
          ]
        )
      ).toEqual({
        a: { b: true, c: true },
        b: { c: true },
        c: {},
      })
    })

    it('should handle circular dependencies', () => {
      expect(
        getAllCustomGraphDependencies(
          {
            nc: { type: 'b' },
            nd: { type: 'c' },
            ne: { type: 'a' },
          },
          [
            { id: 'a', nodes: ['nc'] },
            { id: 'b', nodes: ['nd'] },
            { id: 'c', nodes: ['ne'] },
          ]
        )
      ).toEqual({
        a: { b: true, c: true },
        b: { a: true, c: true },
        c: { a: true, b: true },
      })
    })
  })

  describe('sortCustomGraphByDeps', () => {
    it('should sort custom graphs', () => {
      expect(
        sortCustomGraphByDeps(
          {
            na: { type: 't_na' },
            nb: { type: 't_nb' },
            nc: { type: 'b' },
            nd: { type: 'c' },
          },
          [
            { id: 'c', nodes: [] },
            { id: 'a', nodes: ['na', 'nb', 'nc'] },
            { id: 'b', nodes: ['nd'] },
          ]
        )
      ).toEqual(['c', 'b', 'a'])
    })
    it('should avoid circular dependencies', () => {
      expect(() =>
        sortCustomGraphByDeps(
          {
            nc: { type: 'b' },
            nd: { type: 'c' },
            ne: { type: 'a' },
          },
          [
            { id: 'a', nodes: ['nc'] },
            { id: 'b', nodes: ['nd'] },
            { id: 'c', nodes: ['ne'] },
          ]
        )
      ).not.toThrow()
    })
  })

  describe('getIndepenetCustomGraphIds', () => {
    it('should return independent graph ids', () => {
      const nodes = {
        na: { type: 't_na' },
        nb: { type: 't_nb' },
        nc: { type: 'b' },
        nd: { type: 'c' },
      }
      const graphs = [
        { id: 'a', nodes: ['na', 'nb', 'nc'] },
        { id: 'b', nodes: ['nd'] },
        { id: 'c', nodes: [] },
        { id: 'd', nodes: [] },
      ]
      expect(getIndepenetCustomGraphIds(nodes, graphs, 'a')).toEqual([
        'b',
        'c',
        'd',
      ])
      expect(getIndepenetCustomGraphIds(nodes, graphs, 'b')).toEqual(['c', 'd'])
      expect(getIndepenetCustomGraphIds(nodes, graphs, 'c')).toEqual(['d'])
      expect(getIndepenetCustomGraphIds(nodes, graphs, 'd')).toEqual([
        'a',
        'b',
        'c',
      ])
    })
  })

  describe('convertToCustomGraphOutputInterface', () => {
    it('should return nodes for custom graph', () => {
      let count = 0
      const nodeMap = {
        a: createGraphNode('make_vector2', {
          id: 'a',
          inputs: {
            x: {
              from: { id: 'p', key: 'value' },
            },
          },
        }),
        b: createGraphNode('add_generics', {
          id: 'b',
          inputs: {
            a: {
              from: { id: 'a', key: 'vector2' },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
            },
            b: {
              value: { x: 0, y: 0 },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
            },
          },
        }),
        c: createGraphNode('add_generics', {
          id: 'c',
          inputs: {
            b: {
              from: { id: 'b', key: 'value' },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
            },
          },
        }),
      }
      const result = convertToCustomGraphOutputInterface(
        getGraphNodeModule,
        nodeMap,
        ['a', 'b'],
        'custom',
        () => `id_${count++}`
      )

      expect(result.customGraphNodes).toEqual({
        a: expect.anything(),
        b: expect.anything(),
        id_0: createGraphNode('custom_begin_output', { id: 'id_0' }),
        id_1: createGraphNode('custom_output', {
          id: 'id_1',
          inputs: {
            output: { from: { id: 'id_0', key: 'output' } },
            value: {
              from: { id: 'b', key: 'value' },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
              value: { x: 0, y: 0 },
            },
          },
          data: { name: 'value' },
        }),
      })
      expect(result.updatedNodes).toEqual({
        c: createGraphNode('add_generics', {
          id: 'c',
          inputs: {
            b: {
              from: { id: 'custom', key: 'id_1' },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
            },
          },
        }),
      })
    })

    it('should arrange output nodes by y location', () => {
      let count = 0
      const nodeMap = {
        a: createGraphNode('scaler', { id: 'a', position: { x: 0, y: 10 } }),
        b: createGraphNode('scaler', { id: 'b', position: { x: 0, y: 1 } }),
        c: createGraphNode('make_vector2', {
          id: 'c',
          inputs: {
            x: { from: { id: 'a', key: 'value' } },
            y: { from: { id: 'b', key: 'value' } },
          },
        }),
      }
      const result = convertToCustomGraphOutputInterface(
        getGraphNodeModule,
        nodeMap,
        ['a', 'b'],
        'custom',
        () => `id_${count++}`
      )

      expect(result.customGraphNodes).toEqual({
        a: expect.anything(),
        b: expect.anything(),
        id_0: expect.anything(),
        id_1: createGraphNode('custom_output', {
          id: 'id_1',
          inputs: {
            output: expect.anything(),
            value: {
              from: { id: 'b', key: 'value' },
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
          },
          data: { name: 'value' },
        }),
        id_2: createGraphNode('custom_output', {
          id: 'id_2',
          inputs: {
            output: expect.anything(),
            value: {
              from: { id: 'a', key: 'value' },
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
          },
          data: { name: 'value' },
        }),
      })
    })
  })

  describe('convertToCustomGraphInputInterface', () => {
    const nodeMap = {
      a: createGraphNode('make_vector2', {
        id: 'a',
        inputs: {
          x: {
            from: { id: 'p', key: 'value' },
          },
          y: {
            from: { id: 'q', key: 'value' },
          },
        },
      }),
      b: createGraphNode('add_generics', {
        id: 'b',
        inputs: {
          a: {
            from: { id: 'a', key: 'vector2' },
            genericsType: UNIT_VALUE_TYPES.VECTOR2,
          },
          b: {
            value: { x: 0, y: 0 },
            genericsType: UNIT_VALUE_TYPES.VECTOR2,
          },
        },
      }),
      c: createGraphNode('add_generics', {
        id: 'c',
        inputs: {
          b: {
            from: { id: 'b', key: 'value' },
            genericsType: UNIT_VALUE_TYPES.VECTOR2,
          },
        },
      }),
      d: createGraphNode('make_vector2', {
        id: 'd',
        inputs: {
          y: {
            from: { id: 'p', key: 'value' },
          },
        },
      }),
    }
    const allNodeMap = {
      ...nodeMap,
      p: createGraphNode('scaler', { id: 'p' }),
      q: createGraphNode('scaler', { id: 'q' }),
    }

    it('should return nodes for custom graph', () => {
      let count = 0
      const result = convertToCustomGraphInputInterface(
        getGraphNodeModule,
        allNodeMap,
        ['a', 'b', 'd'],
        () => `id_${count++}`
      )

      expect(result.customGraphNodes).toEqual({
        a: createGraphNode('make_vector2', {
          id: 'a',
          inputs: {
            x: {
              from: { id: 'id_1', key: 'value' },
            },
            y: {
              from: { id: 'id_2', key: 'value' },
            },
          },
        }),
        b: createGraphNode('add_generics', {
          id: 'b',
          inputs: {
            a: {
              from: { id: 'a', key: 'vector2' },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
            },
            b: {
              value: { x: 0, y: 0 },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
            },
          },
        }),
        d: createGraphNode('make_vector2', {
          id: 'd',
          inputs: {
            y: {
              from: { id: 'id_1', key: 'value' },
            },
          },
        }),
        id_0: createGraphNode('custom_begin_input', { id: 'id_0' }),
        id_1: createGraphNode('custom_input', {
          id: 'id_1',
          inputs: {
            input: { from: { id: 'id_0', key: 'input' } },
          },
          data: {
            default: { value: 0, genericsType: UNIT_VALUE_TYPES.SCALER },
          },
        }),
        id_2: createGraphNode('custom_input', {
          id: 'id_2',
          inputs: {
            input: { from: { id: 'id_1', key: 'input' } },
          },
          data: {
            default: { value: 0, genericsType: UNIT_VALUE_TYPES.SCALER },
          },
        }),
      })
      expect(result.inputMap).toEqual({
        id_1: { id: 'p', key: 'value' },
        id_2: { id: 'q', key: 'value' },
      })
    })

    it('generics interface: should return nodes for custom graph', () => {
      let count = 0
      const result = convertToCustomGraphInputInterface(
        getGraphNodeModule,
        allNodeMap,
        ['b'],
        () => `id_${count++}`
      )

      expect(result.customGraphNodes).toEqual({
        b: createGraphNode('add_generics', {
          id: 'b',
          inputs: {
            a: {
              from: { id: 'id_1', key: 'value' },
            },
            b: {},
          },
        }),
        id_0: createGraphNode('custom_begin_input', { id: 'id_0' }),
        id_1: createGraphNode('custom_input', {
          id: 'id_1',
          inputs: {
            input: { from: { id: 'id_0', key: 'input' } },
          },
          data: {
            default: { value: undefined },
          },
        }),
      })
      expect(result.inputMap).toEqual({
        id_1: { id: 'a', key: 'vector2' },
      })
    })

    it('should arrange output nodes by y location', () => {
      let count = 0
      const nodeMap = {
        a: createGraphNode('scaler', { id: 'a', position: { x: 0, y: 10 } }),
        b: createGraphNode('scaler', { id: 'b', position: { x: 0, y: 1 } }),
        c: createGraphNode('make_vector2', {
          id: 'c',
          inputs: {
            x: { from: { id: 'a', key: 'value' } },
          },
        }),
        d: createGraphNode('make_vector2', {
          id: 'd',
          inputs: {
            x: { from: { id: 'b', key: 'value' } },
          },
        }),
      }
      const result = convertToCustomGraphInputInterface(
        getGraphNodeModule,
        nodeMap,
        ['c', 'd'],
        () => `id_${count++}`
      )

      expect(result.customGraphNodes).toEqual({
        c: createGraphNode('make_vector2', {
          id: 'c',
          inputs: {
            x: { from: { id: 'id_2', key: 'value' } },
          },
        }),
        d: createGraphNode('make_vector2', {
          id: 'd',
          inputs: {
            x: { from: { id: 'id_1', key: 'value' } },
          },
        }),
        id_0: expect.anything(),
        id_1: expect.anything(),
        id_2: expect.anything(),
      })
    })
  })

  describe('makeCustomGraphFromNodes', () => {
    const nodeMap = {
      a: createGraphNode('make_vector2', {
        id: 'a',
        inputs: {
          x: {
            from: { id: 'p', key: 'value' },
          },
          y: {
            from: { id: 'q', key: 'value' },
          },
        },
      }),
      b: createGraphNode('add_generics', {
        id: 'b',
        inputs: {
          a: {
            from: { id: 'a', key: 'vector2' },
            genericsType: UNIT_VALUE_TYPES.VECTOR2,
            value: { x: 0, y: 0 },
          },
          b: {
            value: { x: 0, y: 0 },
            genericsType: UNIT_VALUE_TYPES.VECTOR2,
          },
        },
      }),
      c: createGraphNode('add_generics', {
        id: 'c',
        inputs: {
          b: {
            from: { id: 'b', key: 'value' },
            genericsType: UNIT_VALUE_TYPES.VECTOR2,
            value: { x: 0, y: 0 },
          },
        },
      }),
      p: createGraphNode('scaler', { id: 'p' }),
      q: createGraphNode('scaler', { id: 'q' }),
    }

    it('should return nodes for custom graph', () => {
      let count = 0
      const result = makeCustomGraphFromNodes(
        getGraphNodeModule,
        nodeMap,
        ['a', 'b'],
        () => `id_${count++}`
      )

      expect(result.customGraphNodes.a).toEqual(
        createGraphNode('make_vector2', {
          id: 'a',
          inputs: {
            x: {
              from: { id: 'id_4', key: 'value' },
            },
            y: {
              from: { id: 'id_5', key: 'value' },
            },
          },
        })
      )
      expect(result.customGraphNodes.b).toEqual(
        createGraphNode('add_generics', {
          id: 'b',
          inputs: {
            a: {
              from: { id: 'a', key: 'vector2' },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
              value: { x: 0, y: 0 },
            },
            b: {
              value: { x: 0, y: 0 },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
            },
          },
        })
      )

      expect(result.customGraphNodes.id_1).toEqual(
        createGraphNode('custom_begin_output', { id: 'id_1' })
      )
      expect(result.customGraphNodes.id_2).toEqual(
        createGraphNode('custom_output', {
          id: 'id_2',
          inputs: {
            output: { from: { id: 'id_1', key: 'output' } },
            value: {
              from: { id: 'b', key: 'value' },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
              value: { x: 0, y: 0 },
            },
          },
          data: { name: 'value' },
        })
      )

      expect(result.customGraphNodes.id_3).toEqual(
        createGraphNode('custom_begin_input', { id: 'id_3' })
      )
      expect(result.customGraphNodes.id_4).toEqual(
        createGraphNode('custom_input', {
          id: 'id_4',
          inputs: {
            input: { from: { id: 'id_3', key: 'input' } },
          },
          data: {
            default: {
              value: 0,
              genericsType: UNIT_VALUE_TYPES.SCALER,
            },
          },
        })
      )
      expect(result.customGraphNodes.id_5).toEqual(
        createGraphNode('custom_input', {
          id: 'id_5',
          inputs: {
            input: { from: { id: 'id_4', key: 'input' } },
          },
          data: {
            default: {
              value: 0,
              genericsType: UNIT_VALUE_TYPES.SCALER,
            },
          },
        })
      )

      expect(result.customGraph).toEqual(
        getCustomGraph({
          id: 'id_6',
          nodes: ['a', 'b', 'id_1', 'id_2', 'id_3', 'id_4', 'id_5'],
        })
      )

      expect(result.customNode).toEqual({
        id: 'id_0',
        data: {},
        type: 'id_6',
        inputs: {
          id_4: { from: { id: 'p', key: 'value' } },
          id_5: { from: { id: 'q', key: 'value' } },
        },
        position: { x: 0, y: 0 },
      })

      expect(result.updatedNodes).toEqual({
        c: createGraphNode('add_generics', {
          id: 'c',
          inputs: {
            b: {
              from: { id: 'id_0', key: 'id_2' },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
              value: { x: 0, y: 0 },
            },
          },
        }),
      })

      expect(result.deletedNodeIds).toEqual(['a', 'b'])
    })

    it('generics interface: should return nodes for custom graph', () => {
      let count = 0
      const result = makeCustomGraphFromNodes(
        getGraphNodeModule,
        nodeMap,
        ['b'],
        () => `id_${count++}`
      )

      expect(result.customGraphNodes.b).toEqual(
        createGraphNode('add_generics', {
          id: 'b',
          inputs: {
            a: { from: { id: 'id_4', key: 'value' } },
            b: {},
          },
        })
      )

      expect(result.customGraphNodes.id_1).toEqual(
        createGraphNode('custom_begin_output', { id: 'id_1' })
      )
      expect(result.customGraphNodes.id_2).toEqual(
        createGraphNode('custom_output', {
          id: 'id_2',
          inputs: {
            output: { from: { id: 'id_1', key: 'output' } },
            value: { from: { id: 'b', key: 'value' } },
          },
          data: { name: 'value' },
        })
      )

      expect(result.customGraphNodes.id_3).toEqual(
        createGraphNode('custom_begin_input', { id: 'id_3' })
      )
      expect(result.customGraphNodes.id_4).toEqual(
        createGraphNode('custom_input', {
          id: 'id_4',
          inputs: {
            input: { from: { id: 'id_3', key: 'input' } },
          },
          data: { default: {} },
        })
      )

      expect(result.customGraph).toEqual(
        getCustomGraph({
          id: 'id_5',
          nodes: ['b', 'id_1', 'id_2', 'id_3', 'id_4'],
        })
      )

      expect(result.customNode).toEqual({
        id: 'id_0',
        data: {},
        type: 'id_5',
        inputs: {
          id_4: {
            from: { id: 'a', key: 'vector2' },
            genericsType: UNIT_VALUE_TYPES.VECTOR2,
            value: { x: 0, y: 0 },
          },
        },
        position: { x: 0, y: 0 },
      })

      expect(result.updatedNodes).toEqual({
        c: createGraphNode('add_generics', {
          id: 'c',
          inputs: {
            b: {
              from: { id: 'id_0', key: 'id_2' },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
              value: { x: 0, y: 0 },
            },
          },
        }),
      })

      expect(result.deletedNodeIds).toEqual(['b'])
    })
  })

  describe('makeCustomGraphFromNodes: use cases', () => {
    it('generics connections', () => {
      const nodeMap = {
        a: createGraphNode('scaler', { id: 'a' }),
        b: createGraphNode('add_generics', {
          id: 'b',
          inputs: {
            a: {
              from: { id: 'a', key: 'value' },
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
            b: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
          },
        }),
        c: createGraphNode('sub_generics', {
          id: 'c',
          inputs: {
            a: {
              from: { id: 'b', key: 'value' },
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
            b: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
          },
        }),
        d: createGraphNode('make_vector2', {
          id: 'd',
          inputs: {
            x: {
              from: { id: 'c', key: 'value' },
            },
          },
        }),
      }

      let count = 0
      const result = makeCustomGraphFromNodes(
        getGraphNodeModule,
        nodeMap,
        ['b', 'c'],
        () => `id_${count++}`
      )

      expect(Object.keys(result.customGraphNodes).sort()).toEqual([
        'b',
        'c',
        'id_1',
        'id_2',
        'id_3',
        'id_4',
      ])
      expect(result.customGraphNodes.b).toEqual(
        createGraphNode('add_generics', {
          id: 'b',
          inputs: {
            a: {
              from: { id: 'id_4', key: 'value' },
            },
          },
        })
      )
      expect(result.customGraphNodes.c).toEqual(
        createGraphNode('sub_generics', {
          id: 'c',
          inputs: {
            a: {
              from: { id: 'b', key: 'value' },
            },
          },
        })
      )

      expect(result.customGraphNodes.id_1).toEqual(
        createGraphNode('custom_begin_output', { id: 'id_1' })
      )
      expect(result.customGraphNodes.id_2).toEqual(
        createGraphNode('custom_output', {
          id: 'id_2',
          inputs: {
            output: { from: { id: 'id_1', key: 'output' } },
            value: {
              from: { id: 'c', key: 'value' },
            },
          },
          data: { name: 'value' },
        })
      )

      expect(result.customGraphNodes.id_3).toEqual(
        createGraphNode('custom_begin_input', { id: 'id_3' })
      )
      expect(result.customGraphNodes.id_4).toEqual(
        createGraphNode('custom_input', {
          id: 'id_4',
          inputs: {
            input: { from: { id: 'id_3', key: 'input' } },
          },
          data: {
            default: {},
          },
        })
      )

      expect(result.customGraph).toEqual(
        getCustomGraph({
          id: 'id_5',
          nodes: ['b', 'c', 'id_1', 'id_2', 'id_3', 'id_4'],
        })
      )

      expect(result.customNode).toEqual({
        id: 'id_0',
        data: {},
        type: 'id_5',
        inputs: {
          id_4: {
            from: { id: 'a', key: 'value' },
            genericsType: UNIT_VALUE_TYPES.SCALER,
            value: 0,
          },
        },
        position: { x: 0, y: 0 },
      })

      expect(result.updatedNodes).toEqual({
        d: createGraphNode('make_vector2', {
          id: 'd',
          inputs: {
            x: {
              from: { id: 'id_0', key: 'id_2' },
            },
          },
        }),
      })

      expect(result.deletedNodeIds).toEqual(['b', 'c'])
    })

    it('multiple outputs', () => {
      const nodeMap = {
        a: createGraphNode('scaler', { id: 'a' }),
        b: createGraphNode('add_generics', {
          id: 'b',
          inputs: {
            a: {
              from: { id: 'a', key: 'value' },
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
            b: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
          },
        }),
        c: createGraphNode('make_vector2', {
          id: 'c',
          inputs: {
            x: {
              from: { id: 'b', key: 'value' },
            },
          },
        }),
        d: createGraphNode('make_vector2', {
          id: 'd',
          inputs: {
            x: {
              from: { id: 'b', key: 'value' },
            },
          },
        }),
        e: createGraphNode('make_transform', {
          id: 'e',
          inputs: {
            translate: {
              from: { id: 'c', key: 'vector2' },
            },
            scale: {
              from: { id: 'd', key: 'vector2' },
            },
          },
        }),
      }

      let count = 0
      const result = makeCustomGraphFromNodes(
        getGraphNodeModule,
        nodeMap,
        ['b', 'c', 'd'],
        () => `id_${count++}`
      )

      expect(Object.keys(result.customGraphNodes).sort()).toEqual([
        'b',
        'c',
        'd',
        'id_1',
        'id_2',
        'id_3',
        'id_4',
        'id_5',
      ])
      expect(result.customGraphNodes.b).toEqual(
        createGraphNode('add_generics', {
          id: 'b',
          inputs: {
            a: {
              from: { id: 'id_5', key: 'value' },
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
            b: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
          },
        })
      )
      expect(result.customGraphNodes.c).toEqual(
        createGraphNode('make_vector2', {
          id: 'c',
          inputs: {
            x: {
              from: { id: 'b', key: 'value' },
            },
          },
        })
      )
      expect(result.customGraphNodes.d).toEqual(
        createGraphNode('make_vector2', {
          id: 'd',
          inputs: {
            x: {
              from: { id: 'b', key: 'value' },
            },
          },
        })
      )

      expect(result.customGraphNodes.id_1).toEqual(
        createGraphNode('custom_begin_output', { id: 'id_1' })
      )
      expect(result.customGraphNodes.id_2).toEqual(
        createGraphNode('custom_output', {
          id: 'id_2',
          inputs: {
            output: { from: { id: 'id_1', key: 'output' } },
            value: {
              from: { id: 'c', key: 'vector2' },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
              value: { x: 0, y: 0 },
            },
          },
          data: { name: 'vector2' },
        })
      )
      expect(result.customGraphNodes.id_3).toEqual(
        createGraphNode('custom_output', {
          id: 'id_3',
          inputs: {
            output: { from: { id: 'id_2', key: 'output' } },
            value: {
              from: { id: 'd', key: 'vector2' },
              genericsType: UNIT_VALUE_TYPES.VECTOR2,
              value: { x: 0, y: 0 },
            },
          },
          data: { name: 'vector2' },
        })
      )

      expect(result.customGraphNodes.id_4).toEqual(
        createGraphNode('custom_begin_input', { id: 'id_4' })
      )
      expect(result.customGraphNodes.id_5).toEqual(
        createGraphNode('custom_input', {
          id: 'id_5',
          inputs: {
            input: { from: { id: 'id_4', key: 'input' } },
          },
          data: {
            default: {
              genericsType: UNIT_VALUE_TYPES.SCALER,
              value: 0,
            },
          },
        })
      )

      expect(result.customGraph).toEqual(
        getCustomGraph({
          id: 'id_6',
          nodes: ['b', 'c', 'd', 'id_1', 'id_2', 'id_3', 'id_4', 'id_5'],
        })
      )

      expect(result.customNode).toEqual({
        id: 'id_0',
        data: {},
        type: 'id_6',
        inputs: {
          id_5: { from: { id: 'a', key: 'value' } },
        },
        position: { x: 0, y: 0 },
      })

      expect(result.updatedNodes).toEqual({
        e: createGraphNode('make_transform', {
          id: 'e',
          inputs: {
            translate: {
              from: { id: 'id_0', key: 'id_2' },
            },
            scale: {
              from: { id: 'id_0', key: 'id_3' },
            },
          },
        }),
      })

      expect(result.deletedNodeIds).toEqual(['b', 'c', 'd'])
    })
  })

  describe('ajudstCustomNodePosition', () => {
    it('should adjust node layout', () => {
      const result = ajudstCustomNodePosition(
        {
          a: { position: { x: 100, y: 100 } },
          b: { position: { x: 200, y: 300 } },
        },
        { position: { x: 0, y: 0 } }
      )

      expect(result.position).toEqual({ x: 150, y: 200 })
    })
  })

  describe('ajudstCustomGraphNodeLayout', () => {
    it('should adjust node layout', () => {
      const result = ajudstCustomGraphNodeLayout({
        bi: createGraphNode('custom_begin_input', { id: 'bi' }),
        i1: createGraphNode('custom_input', {
          id: 'i1',
          inputs: { input: { from: { id: 'i0', key: 'input' } } },
        }),
        i0: createGraphNode('custom_input', {
          id: 'i0',
          inputs: { input: { from: { id: 'bi', key: 'input' } } },
        }),

        bo: createGraphNode('custom_begin_output', { id: 'bo' }),
        o1: createGraphNode('custom_output', {
          id: 'o1',
          inputs: { output: { from: { id: 'o0', key: 'output' } } },
        }),
        o0: createGraphNode('custom_output', {
          id: 'o0',
          inputs: { output: { from: { id: 'bo', key: 'output' } } },
        }),

        other0: createGraphNode('scaler', {
          id: 'other0',
          position: { x: 100, y: 100 },
        }),
        other1: createGraphNode('scaler', {
          id: 'other1',
          position: { x: 200, y: 300 },
        }),
      })

      expect(result['bi'].position).toEqual({ x: -300, y: 0 })
      expect(result['i0'].position).toEqual({ x: -300, y: 100 })
      expect(result['i1'].position).toEqual({ x: -300, y: 310 })
      expect(result['bo'].position).toEqual({ x: 350, y: 0 })
      expect(result['o0'].position).toEqual({ x: 350, y: 100 })
      expect(result['o1'].position).toEqual({ x: 350, y: 260 })
      expect(result['other0'].position).toEqual({ x: -50, y: 0 })
      expect(result['other1'].position).toEqual({ x: 50, y: 200 })
    })
  })
})
