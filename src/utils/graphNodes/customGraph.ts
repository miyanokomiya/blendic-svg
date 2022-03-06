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

import { CustomGraph, IdMap } from '/@/models'
import {
  GraphNode,
  GraphNodeCustomBeginInput,
  GraphNodeCustomBeginOutput,
  GraphNodeCustomInput,
  GraphNodeCustomOutput,
} from '/@/models/graphNode'
import { toList } from '/@/utils/commons'
import {
  NodeModule,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'

export function createCustomNodeModule(
  customGraph: CustomGraph,
  innerNodeMap: IdMap<GraphNode>
): NodeModule<any> {
  const customInterface = getCustomInterfaceNode(customGraph, innerNodeMap)
  const inputs = createInputsStruct(customInterface)

  return {
    struct: {
      create: (arg = {}) => ({
        ...arg,
        type: `cg_${customGraph.id}`,
      }),
      data: {},
      inputs,
      outputs: {},
      computation: () => {
        return {}
      },
      width: 200,
      label: `${customGraph.name}`,
    },
  }
}

interface CustomInterface {
  beginInputNode?: GraphNodeCustomBeginInput
  inputNodes: IdMap<GraphNodeCustomInput>
  beginOutputNode?: GraphNodeCustomBeginOutput
  outputNodes: IdMap<GraphNodeCustomOutput>
}

function getCustomInterfaceNode(
  customGraph: CustomGraph,
  innerNodeMap: IdMap<GraphNode>
): CustomInterface {
  return customGraph.nodes.reduce<{
    beginInputNode?: GraphNodeCustomBeginInput
    inputNodes: IdMap<GraphNodeCustomInput>
    beginOutputNode?: GraphNodeCustomBeginOutput
    outputNodes: IdMap<GraphNodeCustomOutput>
  }>(
    (info, id) => {
      const node = innerNodeMap[id]
      switch (node.type) {
        case 'custom_begin_input':
          info.beginInputNode = node as GraphNodeCustomBeginInput
          break
        case 'custom_input':
          info.inputNodes[node.id] = node as GraphNodeCustomInput
          break
        case 'custom_begin_output':
          info.beginOutputNode = node as GraphNodeCustomBeginOutput
          break
        case 'custom_output':
          info.outputNodes[node.id] = node as GraphNodeCustomOutput
          break
      }
      return info
    },
    {
      beginInputNode: undefined,
      inputNodes: {},
      beginOutputNode: undefined,
      outputNodes: {},
    }
  )
}

function createInputsStruct({
  beginInputNode,
  inputNodes,
}: Pick<
  CustomInterface,
  'beginInputNode' | 'inputNodes'
>): NodeStruct<any>['inputs'] {
  if (!beginInputNode) return {}

  const inputMap = toList(inputNodes).reduce<{ [fromId: string]: string }>(
    (p, node) => {
      if (node.inputs.input.from) {
        p[node.inputs.input.from.id] = node.id
      }
      return p
    },
    {}
  )

  const inputIds = []
  let lastId: string | undefined = inputMap[beginInputNode.id]
  while (lastId) {
    inputIds.push(lastId)
    lastId = inputMap[lastId]
  }

  return inputIds.reduce<NodeStruct<any>['inputs']>((inputs, id) => {
    const node = inputNodes[id]
    inputs[id] = {
      label: node.data.name,
      type: node.data.default.genericsType ?? UNIT_VALUE_TYPES.GENERICS,
      default: node.data.default.value,
    }
    return inputs
  }, {})
}
