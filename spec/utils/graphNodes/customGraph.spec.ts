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
import { createGraphNode } from '/@/utils/graphNodes'
import { UNIT_VALUE_TYPES } from '/@/utils/graphNodes/core'
import { createCustomNodeModule } from '/@/utils/graphNodes/customGraph'

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
  })
})
