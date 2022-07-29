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

import { CustomGraph, getCustomGraph, IdMap, toMap } from '/@/models'
import {
  GraphNode,
  GraphNodeBase,
  GraphNodeCustomBeginInput,
  GraphNodeCustomBeginOutput,
  GraphNodeCustomInput,
  GraphNodeCustomOutput,
  GraphNodeOutputMap,
  GraphNodeOutputValues,
  GraphNodeType,
} from '/@/models/graphNode'
import { mapFilter, mapReduce, toList } from '/@/utils/commons'
import {
  cleanAllEdgeGenerics,
  createGraphNode,
  createGraphNodeIncludeCustom,
  GetGraphNodeModule,
  getInputsConnectedTo,
  getUpdatedNodeMapToDisconnectNodeInput,
  resolveAllNodes,
  updateNodeInput,
} from '/@/utils/graphNodes'
import {
  NodeModule,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'
import { DependencyMap, getAllDependencies } from '/@/utils/relations'

export function createCustomNodeModule(
  customGraph: CustomGraph,
  innerNodeMap: IdMap<GraphNode>
): NodeModule<GraphNode> {
  const customInterface = getCustomInterfaceNode(customGraph, innerNodeMap)
  const inputs = createInputsStruct(customInterface)
  const outputs = createOutputsStruct(customInterface)

  return {
    struct: {
      create: (arg = {}) =>
        ({
          position: { x: 0, y: 0 },
          ...arg,
          type: customGraph.id,
          data: {},
          inputs: mapReduce(inputs, (input) => ({
            value: input.default,
          })),
        } as GraphNodeBase),
      data: {},
      inputs,
      outputs,
      computation: (inputs, self, context, getGraphNodeModule) => {
        return context.beginNamespace(self.id, () => {
          return stubOutputNodes(
            customInterface.outputNodes,
            resolveAllNodes(
              getGraphNodeModule!,
              context,
              stubInputNodes(innerNodeMap, inputs)
            )
          )
        })
      },
      width: 140,
      color: '#ff6347',
      textColor: '#fff',
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

  const chainMap = toList(inputNodes).reduce<{ [from: string]: string }>(
    (p, node) => {
      if (node.inputs.input.from) {
        p[node.inputs.input.from.id] = node.id
      }
      return p
    },
    {}
  )

  return getIdChain(chainMap, beginInputNode.id).reduce<
    NodeStruct<any>['inputs']
  >((inputs, id) => {
    const node = inputNodes[id]
    inputs[id] = {
      label: node.data.name,
      type: node.data.default.genericsType ?? UNIT_VALUE_TYPES.GENERICS,
      default: node.data.default.value,
    }
    return inputs
  }, {})
}

function createOutputsStruct({
  beginOutputNode,
  outputNodes,
}: Pick<
  CustomInterface,
  'beginOutputNode' | 'outputNodes'
>): NodeStruct<any>['outputs'] {
  if (!beginOutputNode) return {}

  const chainMap = toList(outputNodes).reduce<{ [from: string]: string }>(
    (p, node) => {
      if (node.inputs.output.from) {
        p[node.inputs.output.from.id] = node.id
      }
      return p
    },
    {}
  )

  return getIdChain(chainMap, beginOutputNode.id).reduce<
    NodeStruct<any>['outputs']
  >((outputs, id) => {
    const node = outputNodes[id]
    outputs[id] = {
      ...(node.inputs.value.genericsType ?? UNIT_VALUE_TYPES.GENERICS),
      label: node.data.name,
    }
    return outputs
  }, {})
}

function getIdChain(
  chainMap: { [from: string]: string },
  from: string
): string[] {
  const ids = []
  let lastId: string | undefined = chainMap[from]
  while (lastId) {
    ids.push(lastId)
    lastId = chainMap[lastId]
  }

  return ids
}

function stubInputNodes(
  innerNodeMap: IdMap<GraphNode>,
  inputs: { [key: string]: any }
): IdMap<GraphNode> {
  const stubbedNodes = Object.entries(inputs).reduce<IdMap<GraphNode>>(
    (p, [key, input]) => {
      const inputNode = innerNodeMap[key]
      if (inputNode) {
        p[inputNode.id] = {
          ...inputNode,
          data: {
            ...inputNode.data,
            default: { ...(inputNode.data.default as any), value: input },
          },
        }
      }
      return p
    },
    {}
  )
  return { ...innerNodeMap, ...stubbedNodes }
}

function stubOutputNodes(
  outputNodeMap: IdMap<GraphNodeCustomOutput>,
  nodeOutputValueMap: GraphNodeOutputMap
): GraphNodeOutputValues {
  return toList(outputNodeMap).reduce<GraphNodeOutputValues>(
    (p, outputNode) => {
      if (outputNode.inputs.value.from) {
        const connectedValues =
          nodeOutputValueMap[outputNode.inputs.value.from.id]
        if (connectedValues) {
          p[outputNode.id] = connectedValues[outputNode.inputs.value.from.key]
        }
      }
      return p
    },
    {}
  )
}

export function getAllCustomGraphDependencies(
  nodeMap: IdMap<Pick<GraphNode, 'type'>>,
  customGraphs: Pick<CustomGraph, 'id' | 'nodes'>[]
): DependencyMap {
  const customIds = new Set(customGraphs.map((c) => c.id))

  const firstOrderDepMap = customGraphs.reduce<DependencyMap>((p, c) => {
    p[c.id] = getCustomGraphFirstDependencies(nodeMap, customIds, c)
    return p
  }, {})

  return Array.from(customIds).reduce<DependencyMap>((p, id) => {
    p[id] = getAllDependencies(firstOrderDepMap, id)
    return p
  }, {})
}

export function getCustomGraphDependencies(
  nodeMap: IdMap<Pick<GraphNode, 'type'>>,
  customGraphs: Pick<CustomGraph, 'id' | 'nodes'>[],
  targetId: string
): { [id: string]: true } {
  const customIds = new Set(customGraphs.map((c) => c.id))

  const firstOrderDepMap = customGraphs.reduce<DependencyMap>((p, c) => {
    p[c.id] = getCustomGraphFirstDependencies(nodeMap, customIds, c)
    return p
  }, {})
  return getAllDependencies(firstOrderDepMap, targetId)
}

function getCustomGraphFirstDependencies(
  nodeMap: IdMap<Pick<GraphNode, 'type'>>,
  customIds: Set<string>,
  target: Pick<CustomGraph, 'nodes'>
): { [id: string]: true } {
  return target.nodes.reduce<{ [id: string]: true }>((p, id) => {
    const node = nodeMap[id]
    if (node && customIds.has(node.type as string)) {
      p[node.type] = true
    }
    return p
  }, {})
}

export function getIndepenetCustomGraphIds(
  nodeMap: IdMap<Pick<GraphNode, 'type'>>,
  customGraphs: Pick<CustomGraph, 'id' | 'nodes'>[],
  targetId: string
): string[] {
  const deps = getAllCustomGraphDependencies(nodeMap, customGraphs)
  return Object.entries(deps)
    .filter(([id, dep]) => !dep[targetId] && id !== targetId)
    .map(([id]) => id)
}

export function makeCustomGraphFromNodes(
  getGraphNodeModule: GetGraphNodeModule,
  allNodeMap: IdMap<GraphNode>,
  targetIds: string[],
  generateId: () => string
): {
  customGraph: CustomGraph
  customGraphNodes: IdMap<GraphNode>
  customNode: GraphNode
  updatedNodes: IdMap<GraphNode>
  deletedNodeIds: string[]
} {
  const targetIdSet = new Set(targetIds)
  const filterdTargets = mapFilter(
    allNodeMap,
    (node) => targetIdSet.has(node.id) && canMakeCustomGraphFrom(node)
  )

  const customGraphNodeId = generateId()

  const outputInfo = convertToCustomGraphOutputInterface(
    getGraphNodeModule,
    allNodeMap,
    Object.keys(filterdTargets),
    customGraphNodeId,
    generateId
  )

  const inputInfo = convertToCustomGraphInputInterface(
    getGraphNodeModule,
    Object.values({ ...filterdTargets, ...outputInfo.customGraphNodes }),
    generateId
  )

  const customGraphNodes = {
    ...inputInfo.customGraphNodes,
    ...cleanAllEdgeGenerics(getGraphNodeModule, inputInfo.customGraphNodes),
  }

  const customGraph = getCustomGraph({
    id: generateId(),
    nodes: Object.keys(customGraphNodes).sort(),
  })

  const customModule = createCustomNodeModule(customGraph, customGraphNodes)
  const nextGetGraphNodeModule = (type: GraphNodeType) => {
    return type === customGraph.id ? customModule : getGraphNodeModule(type)
  }

  const customNodeSrc = createGraphNodeIncludeCustom(
    { [customGraph.id]: customModule },
    customGraph.id,
    { id: customGraphNodeId }
  )

  let customNode = customNodeSrc
  Object.entries(inputInfo.inputMap).forEach(([key, from]) => {
    customNode =
      updateNodeInput(
        nextGetGraphNodeModule,
        { [customNode.id]: customNode, [from.id]: allNodeMap[from.id] },
        customNode.id,
        key,
        from.id,
        from.key
      )[customNode.id] ?? customNode
  })

  return {
    customGraph,
    customGraphNodes,
    customNode,
    updatedNodes: outputInfo.updatedNodes,
    deletedNodeIds: Object.keys(filterdTargets),
  }
}

/**
 * Should execute this function before "convertToCustomGraphInputInterface"
 */
export function convertToCustomGraphOutputInterface(
  getGraphNodeModule: GetGraphNodeModule,
  allNodeMap: IdMap<GraphNode>,
  targetIds: string[],
  customGraphNodeId: string,
  generateId: () => string
): { customGraphNodes: IdMap<GraphNode>; updatedNodes: IdMap<GraphNode> } {
  const targetIdSet = new Set(targetIds)
  const otherNodeMap = mapFilter(allNodeMap, (_, id) => !targetIdSet.has(id))
  const updatedNodes: IdMap<GraphNode> = {}
  const customGraphNodes: IdMap<GraphNode> = mapFilter(allNodeMap, (_, id) =>
    targetIdSet.has(id)
  )

  const customBeginOutput = createGraphNode('custom_begin_output', {
    id: generateId(),
  })
  customGraphNodes[customBeginOutput.id] = customBeginOutput

  targetIds.forEach((id) => {
    const node = allNodeMap[id]
    const struct = getGraphNodeModule(node.type)?.struct
    if (!struct) return

    Object.keys(struct.outputs).forEach((key) => {
      const connections = Object.entries(
        getInputsConnectedTo(otherNodeMap, id, key)
      )
      if (connections.length === 0) return

      const customOutput = createGraphNode('custom_output', {
        id: generateId(),
        inputs: {
          output: { from: { id: customBeginOutput.id, key: 'output' } },
        },
      })
      customGraphNodes[customOutput.id] = customOutput

      Object.values(
        updateNodeInput(
          getGraphNodeModule,
          customGraphNodes,
          customOutput.id,
          'value',
          id,
          key
        )
      ).forEach((n) => {
        customGraphNodes[n.id] = n
      })
      console.log(customGraphNodes[customOutput.id])

      connections.forEach(([inputNodeId, inputs]) => {
        const inputNode = allNodeMap[inputNodeId]
        const updated = {
          ...inputNode,
          inputs: {
            ...inputNode.inputs,
            ...mapReduce(inputs, (_, key) => ({
              ...inputNode.inputs[key],
              value: inputNode.inputs[key].value,
              from: { id: customGraphNodeId, key: customOutput.id },
            })),
          },
        }
        updatedNodes[updated.id] = updated
      })
    })
  })

  return { customGraphNodes, updatedNodes }
}

export function convertToCustomGraphInputInterface(
  getGraphNodeModule: GetGraphNodeModule,
  nodes: GraphNode[],
  generateId: () => string
): {
  customGraphNodes: IdMap<GraphNode>
  inputMap: { [key: string]: { id: string; key: string } }
} {
  const convertedMap = toMap(nodes)
  const inputMap: { [key: string]: { id: string; key: string } } = {}

  const inputInterfaceMap: IdMap<{
    [key: string]: { id: string; key: string }[]
  }> = {}
  nodes.forEach((n) => {
    Object.entries(n.inputs).forEach(([key, input]) => {
      if (!input.from || convertedMap[input.from.id]) {
        return
      }

      inputInterfaceMap[input.from.id] ??= {}
      inputInterfaceMap[input.from.id][input.from.key] ??= []
      inputInterfaceMap[input.from.id][input.from.key].push({ id: n.id, key })
    })
  })

  const customBeginInput = createGraphNode('custom_begin_input', {
    id: generateId(),
  })
  convertedMap[customBeginInput.id] = customBeginInput

  let currentInputId = customBeginInput.id
  Object.entries(inputInterfaceMap).forEach(([id, inputs]) => {
    Object.entries(inputs).forEach(([key, connections]) => {
      const customInput = createGraphNode('custom_input', {
        id: generateId(),
        inputs: {
          input: {
            from: { id: currentInputId, key: 'input' },
          },
        },
      })
      convertedMap[customInput.id] = customInput
      currentInputId = customInput.id
      inputMap[customInput.id] = { id, key }

      connections.forEach((connection) => {
        Object.values(
          getUpdatedNodeMapToDisconnectNodeInput(
            getGraphNodeModule,
            convertedMap,
            connection.id,
            connection.key
          )
        ).forEach((n) => {
          convertedMap[n.id] = n
        })
        Object.values(
          updateNodeInput(
            getGraphNodeModule,
            convertedMap,
            connection.id,
            connection.key,
            customInput.id,
            'value'
          )
        ).forEach((n) => {
          convertedMap[n.id] = n
        })
      })
    })
  })

  return {
    customGraphNodes: convertedMap,
    inputMap,
  }
}

function canMakeCustomGraphFrom(node: Pick<GraphNode, 'type'>): boolean {
  return ![
    'custom_begin_input',
    'custom_input',
    'custom_begin_output',
    'custom_output',
    'get_bone',
    'get_object',
  ].includes(node.type as string)
}
