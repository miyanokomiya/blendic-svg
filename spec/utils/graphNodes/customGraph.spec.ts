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
  createCustomNodeModule,
  getAllCustomGraphDependencies,
  getCustomGraphDependencies,
  getIndepenetCustomGraphIds,
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

  describe('getCustomGraphDependencies', () => {
    it('should return dependencies', () => {
      expect(
        getCustomGraphDependencies(
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
          ],
          'a'
        )
      ).toEqual({ b: true, c: true })
    })

    it('should ignore circular dependencies', () => {
      expect(
        getCustomGraphDependencies(
          {
            nc: { type: 'b' },
            nd: { type: 'c' },
            ne: { type: 'a' },
          },
          [
            { id: 'a', nodes: ['nc'] },
            { id: 'b', nodes: ['nd'] },
            { id: 'c', nodes: ['ne'] },
          ],
          'a'
        )
      ).toEqual({ b: true, c: true })
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
})
