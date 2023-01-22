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

import { add, IVec2 } from 'okageo'
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
  ValueType,
} from '/@/models/graphNode'
import { mapFilter, mapReduce, toList } from '/@/utils/commons'
import { gridRound } from '/@/utils/geometry'
import {
  cleanAllEdgeGenerics,
  createGraphNode,
  createGraphNodeIncludeCustom,
  getAllEdgeConnectionInfo,
  getEdgeChainGroupAt,
  GetGraphNodeModule,
  getInputsConnectedTo,
  getUpdatedNodeMapToDisconnectNodeInput,
  isGenericsResolved,
  resolveAllNodes,
  updateNodeInput,
} from '/@/utils/graphNodes'
import {
  isSameValueType,
  NodeModule,
  NodeStruct,
  UNIT_VALUE_TYPES,
} from '/@/utils/graphNodes/core'
import { DependencyMap, getAllDependentTo, topSort } from '/@/utils/relations'

export function createCustomNodeModule(
  getGraphNodeModule: GetGraphNodeModule,
  customGraph: CustomGraph,
  innerNodeMap: IdMap<GraphNode>
): NodeModule<GraphNode> {
  const customInterface = getCustomInterfaceNode(customGraph, innerNodeMap)

  const defaultMaxLoop = Math.max(
    customInterface.beginOutputNode?.data.max_loop ?? 1,
    1
  )

  // Pick loop struct information from inner nodes
  const loopStruct = Object.entries(customInterface.inputNodes).reduce<{
    [id: string]: string
  }>((p, [id, c]) => {
    const output = c.inputs.output.from?.id
    if (output) {
      p[id] = output
    }
    return p
  }, {})

  // Remove loop struct from inner nodes
  const innerNodeMapWithoutLoopStruct = mapReduce(innerNodeMap, (n) => {
    if (n.type !== 'custom_input') return n

    const ret = { ...n, inputs: { ...n.inputs } }
    delete ret.inputs.output
    return ret
  })

  const inputsStruct = createInputsStruct(customInterface)
  const outputsStruct = createOutputsStruct(customInterface)

  const allEdgeConnectionInfo = getAllEdgeConnectionInfo(
    innerNodeMapWithoutLoopStruct
  )

  const interfaceIdSet = new Set([
    ...Object.keys(inputsStruct),
    ...Object.keys(outputsStruct),
  ])
  const chains = Object.keys(inputsStruct)
    .map((key) => {
      return getEdgeChainGroupAt(
        getGraphNodeModule,
        innerNodeMapWithoutLoopStruct,
        allEdgeConnectionInfo,
        { id: key, key: 'value', output: true }
      ).map((item) => {
        // Inner ids becone interface keys
        const p = { ...item, key: item.id }
        // Inner outputs become interface inputs vice versa
        if (!item.output && !item.data) p.output = true
        else if (item.output) delete p.output
        return p
      })
    })
    // Drop resolved chains
    .filter((chain) => chain.every((item) => !isGenericsResolved(item.type)))
    // Drop inner items
    .map((chain) =>
      chain.filter((item) => !item.data && interfaceIdSet.has(item.id))
    )
    .map((chain) =>
      chain.map((item) => {
        const p: { key: string; output?: true } = { key: item.key }
        if (item.output) p.output = true
        return p
      })
    )

  const outputChainMap = new Map(
    chains
      .filter((c) => c.some((item) => item.output))
      .map((c) => {
        const o = c.find((item) => item.output)!
        const i = c.find((item) => !item.output)!
        return [o.key, i.key]
      })
  )

  const getOutputType =
    outputChainMap.size > 0
      ? (self: any, key: string): ValueType => {
          const src = innerNodeMapWithoutLoopStruct[key]
          const genericsType = src.inputs.value.genericsType
          if (isGenericsResolved(genericsType)) return genericsType

          const inputKey = outputChainMap.get(key)
          if (inputKey) return self.inputs[inputKey].genericsType
          return UNIT_VALUE_TYPES.UNKNOWN
        }
      : undefined

  const isSameInputOutputType = (
    self: GraphNode,
    inputId: string,
    outputId: string
  ): boolean => {
    return isSameValueType(
      getOutputType?.(self, outputId) ?? outputsStruct[outputId],
      inputsStruct[inputId].type ?? self.inputs[inputId].genericsType
    )
  }

  return {
    struct: {
      create: (arg = {}) =>
        ({
          position: { x: 0, y: 0 },
          ...arg,
          type: customGraph.id,
          data: { max_loop: defaultMaxLoop },
          inputs: mapReduce(inputsStruct, (input) => ({
            value: input.default,
          })),
        } as GraphNodeBase),
      data: {
        max_loop: {
          type: UNIT_VALUE_TYPES.SCALER,
          default: defaultMaxLoop,
        },
      },
      inputs: inputsStruct,
      outputs: outputsStruct,
      computation: (inputs, self, context, getGraphNodeModule) => {
        const maxLoop = (self.data.max_loop as number) ?? 1
        let result: GraphNodeOutputValues
        let resolved: GraphNodeOutputMap
        let nextInputs = inputs
        let loop = true
        let count = 0

        const filteredLoopStruct = mapFilter(loopStruct, (outputId, inputId) =>
          isSameInputOutputType(self, inputId, outputId)
        )

        while (loop && count < maxLoop) {
          result = context.beginNamespace(`${self.id}-l${count}`, () => {
            // Have to run in the namespace
            resolved = resolveAllNodes(
              getGraphNodeModule!,
              context,
              stubInputNodes(innerNodeMapWithoutLoopStruct, nextInputs)
            )
            return stubOutputNodes(customInterface.outputNodes, resolved)
          })
          loop = customInterface.beginOutputNode
            ? cumputeLoopResult(customInterface.beginOutputNode, resolved!)
            : false
          nextInputs = mapReduce(nextInputs, (value, key) => {
            const outputId = filteredLoopStruct[key]
            return outputId ? result[outputId] : value
          })
          count++
        }

        return result!
      },
      width: 140,
      color: '#ff6347',
      textColor: '#fff',
      label: `${customGraph.name}`,
      getOutputType,
      genericsChains: chains.length > 0 ? chains : undefined,
      getErrors: (self) => {
        const errors = Object.entries(loopStruct)
          .filter(
            ([inputId, outputId]) =>
              !isSameInputOutputType(self, inputId, outputId)
          )
          .map(
            ([inputId, outputId]) =>
              `Type of "${
                inputsStruct[inputId].label ?? inputId
              }" doesn't match "${outputsStruct[outputId].label ?? outputId}"`
          )
        return errors.length > 0 ? errors : undefined
      },
      custom: true,
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

function cumputeLoopResult(
  beginOutputNode: GraphNodeCustomBeginOutput,
  nodeOutputValueMap: GraphNodeOutputMap
): boolean {
  const loopInput = beginOutputNode.inputs.loop
  if (loopInput.from) {
    const connectedValues = nodeOutputValueMap[loopInput.from.id]
    return !!connectedValues[loopInput.from.key]
  } else {
    return !!loopInput.value
  }
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

function getAllCustomGraphFirstDependencies(
  nodeMap: IdMap<Pick<GraphNode, 'type'>>,
  customGraphs: Pick<CustomGraph, 'id' | 'nodes'>[]
): IdMap<{ [id: string]: true }> {
  const idSet = new Set(customGraphs.map((c) => c.id))
  return customGraphs.reduce<IdMap<{ [id: string]: true }>>((deps, custom) => {
    deps[custom.id] = getCustomGraphFirstDependencies(nodeMap, idSet, custom)
    return deps
  }, {})
}

export function sortCustomGraphByDeps(
  nodeMap: IdMap<Pick<GraphNode, 'type'>>,
  customGraphs: Pick<CustomGraph, 'id' | 'nodes'>[]
): string[] {
  return topSort(getAllCustomGraphFirstDependencies(nodeMap, customGraphs))
}

export function getIndepenetCustomGraphIds(
  nodeMap: IdMap<Pick<GraphNode, 'type'>>,
  customGraphs: Pick<CustomGraph, 'id' | 'nodes'>[],
  targetId: string
): string[] {
  const customIds = new Set(customGraphs.map((c) => c.id))

  const firstOrderDepMap = customGraphs.reduce<DependencyMap>((p, c) => {
    p[c.id] = getCustomGraphFirstDependencies(nodeMap, customIds, c)
    return p
  }, {})

  const dependents = new Set(getAllDependentTo(firstOrderDepMap, targetId))
  dependents.add(targetId)
  return customGraphs.filter((c) => !dependents.has(c.id)).map((c) => c.id)
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
    { ...allNodeMap, ...outputInfo.customGraphNodes },
    Object.keys({ ...filterdTargets, ...outputInfo.customGraphNodes }),
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

  const customModule = createCustomNodeModule(
    getGraphNodeModule,
    customGraph,
    customGraphNodes
  )
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
  const sortedTargetIds = targetIds
    .map((id) => allNodeMap[id])
    .sort((a, b) => a.position.y - b.position.y)
    .map((n) => n.id)

  const targetIdSet = new Set(sortedTargetIds)
  const otherNodeMap = mapFilter(allNodeMap, (_, id) => !targetIdSet.has(id))
  const updatedNodes: IdMap<GraphNode> = {}
  const customGraphNodes: IdMap<GraphNode> = mapFilter(allNodeMap, (_, id) =>
    targetIdSet.has(id)
  )

  const customBeginOutput = createGraphNode('custom_begin_output', {
    id: generateId(),
  })
  customGraphNodes[customBeginOutput.id] = customBeginOutput

  let currentOutputId = customBeginOutput.id
  sortedTargetIds.forEach((id) => {
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
          output: { from: { id: currentOutputId, key: 'output' } },
        },
        data: {
          name: struct.outputs[key].label ?? key,
        },
      })
      currentOutputId = customOutput.id
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

      connections.forEach(([inputNodeId, inputs]) => {
        const inputNode = updatedNodes[inputNodeId] ?? allNodeMap[inputNodeId]
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
  // nodes: GraphNode[],
  allNodeMap: IdMap<GraphNode>,
  targetIds: string[],
  generateId: () => string
): {
  customGraphNodes: IdMap<GraphNode>
  inputMap: { [key: string]: { id: string; key: string } }
} {
  const nodes = targetIds.map((id) => allNodeMap[id])
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

  const inputInterfaceIds = Object.keys(inputInterfaceMap)
    .map((id) => allNodeMap[id])
    .sort((a, b) => a.position.y - b.position.y)
    .map((n) => n.id)

  let currentInputId = customBeginInput.id
  inputInterfaceIds.forEach((id) => {
    const inputs = inputInterfaceMap[id]
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

export function ajudstCustomNodePosition<T extends Pick<GraphNode, 'position'>>(
  srcNodes: IdMap<T>,
  customNode: T
) {
  const nodes = toList(srcNodes)
  const otherPositions =
    nodes.length > 0 ? nodes.map((n) => n.position) : [{ x: 0, y: 0 }]
  const minX = Math.min(...otherPositions.map((p) => p.x))
  const maxX = Math.max(...otherPositions.map((p) => p.x))
  const minY = Math.min(...otherPositions.map((p) => p.y))
  const maxY = Math.max(...otherPositions.map((p) => p.y))
  const diff = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  return { ...customNode, position: add(customNode.position, diff) }
}

export function ajudstCustomGraphNodeLayout<T extends GraphNode>(
  nodes: IdMap<T>
): IdMap<T> {
  const inputs: T[] = []
  const outputs: T[] = []
  const others: T[] = []

  Object.values(nodes).forEach((n) => {
    switch (n.type) {
      case 'custom_begin_input':
      case 'custom_begin_output':
        return
      case 'custom_input':
        inputs.push(n)
        return
      case 'custom_output':
        outputs.push(n)
        return
      default:
        others.push(n)
        return
    }
  })

  const inputIds = new Map(
    topSort(
      inputs.reduce<DependencyMap>((p, n) => {
        const from = n.inputs.input.from
        if (from) {
          p[n.id] = { [from.id]: true }
        }
        return p
      }, {})
    ).map((id, i) => [id, i])
  )
  const outputIds = new Map(
    topSort(
      outputs.reduce<DependencyMap>((p, n) => {
        const from = n.inputs.output.from
        if (from) {
          p[n.id] = { [from.id]: true }
        }
        return p
      }, {})
    ).map((id, i) => [id, i])
  )

  const otherPositions =
    others.length > 0 ? others.map((n) => n.position) : [{ x: 0, y: 0 }]
  const minX = Math.min(...otherPositions.map((p) => p.x))
  const maxX = Math.max(...otherPositions.map((p) => p.x))
  const minY = Math.min(...otherPositions.map((p) => p.y))
  const diff = { x: -(minX + maxX) / 2, y: -minY }

  // Add rough margin
  const inputX = gridRound(10, minX + diff.x - 250)
  const outputX = gridRound(10, maxX + diff.x + 300)

  return mapReduce(nodes, (n) => {
    let p: IVec2
    if (n.type === 'custom_begin_input') {
      p = { x: inputX, y: 0 }
    } else if (n.type === 'custom_begin_output') {
      p = { x: outputX, y: 0 }
    } else if (inputIds.has(n.id)) {
      p = { x: inputX, y: 210 * inputIds.get(n.id)! + 100 }
    } else if (outputIds.has(n.id)) {
      p = { x: outputX, y: 160 * outputIds.get(n.id)! + 100 }
    } else {
      p = add(n.position, diff)
    }

    return { ...n, position: p }
  })
}
