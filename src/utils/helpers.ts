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

import { IVec2, IRectangle, isZero, add, sub, multi } from 'okageo'
import { Size } from 'okanvas'
import { IdMap, Bone, ElementNodeAttributes, Transform } from '../models/index'
import {
  GraphNode,
  GraphNodeEdgeInfo,
  GRAPH_VALUE_TYPE,
  GRAPH_VALUE_TYPE_KEY,
  ValueType,
  ValueTypeScaler,
} from '/@/models/graphNode'
import { getGraphValueEnumKey } from '/@/models/graphNodeEnums'
import { posedHsva } from '/@/utils/attributesResolver'
import { hsvaToRgba, rednerRGBA } from '/@/utils/color'
import { BoneConstraint } from '/@/utils/constraints'
import { GetGraphNodeModule, getNodeEdgeTypes } from '/@/utils/graphNodes'
import { NodeStruct, NodeModule } from '/@/utils/graphNodes/core'

function getScaleText(scale: IVec2, origin: IVec2): string {
  if (scale.x === 1 && scale.y === 1) return ''

  return [
    isZero(origin) ? '' : `translate(${origin.x},${origin.y})`,
    `scale(${scale.x},${scale.y})`,
    isZero(origin) ? '' : `translate(${-origin.x},${-origin.y})`,
  ]
    .filter((s) => !!s)
    .join(' ')
}

export function getTnansformStr(transform: Transform): string {
  return [
    isZero(transform.translate)
      ? ''
      : `translate(${transform.translate.x},${transform.translate.y})`,
    getScaleText(transform.scale, transform.origin),
    transform.rotate === 0
      ? ''
      : `rotate(${transform.rotate} ${transform.origin.x} ${transform.origin.y})`,
  ]
    .filter((s) => !!s)
    .join(' ')
}

export function d(points: IVec2[], closed = false): string {
  if (points.length === 0) return ''

  const [head, ...body] = points
  return (
    `M${head.x},${head.y}` +
    body.map((p) => `L${p.x},${p.y}`).join('') +
    (closed ? 'z' : '')
  )
}

export function gridLineElm(
  origin: IVec2,
  vec: IVec2,
  viewCanvasRect: IRectangle
) {
  const length = Math.max(viewCanvasRect.width, viewCanvasRect.height) * 2
  const v = multi(vec, length)

  return {
    from: sub(origin, v),
    to: add(origin, v),
  }
}

export function viewbox(rect: IRectangle): string {
  return `${rect.x} ${rect.y} ${rect.width} ${rect.height}`
}

export function parseStyle(val = ''): { [name: string]: string } {
  return val
    .split(';')
    .map((e) => e.split(':'))
    .reduce<{ [name: string]: string }>((p, c) => {
      if (c.length === 2) {
        p[c[0].trim()] = c[1].trim()
      }
      return p
    }, {})
}

export function toStyle(obj: { [name: string]: string | undefined }): string {
  return Object.entries(obj)
    .filter((e) => e[1])
    .map((e) => `${e[0]}:${e[1]};`)
    .join('')
}

export function normalizeAttributes(
  attributes: ElementNodeAttributes
): ElementNodeAttributes {
  if (!attributes.fill && !attributes.stroke) return attributes

  return {
    ...attributes,
    style: toStyle({
      ...parseStyle(attributes.style),
      ...(attributes.fill ? { fill: attributes.fill } : {}),
      ...(attributes.stroke ? { stroke: attributes.stroke } : {}),
    }),
  }
}

export function getKeyframeTopMap(
  height: number,
  top: number,
  childMap: { [key: string]: number }
): { [key: string]: number } {
  return Object.keys(childMap).reduce<{ [key: string]: number }>((p, c) => {
    p[c] = top + height * (childMap[c] + 1)
    return p
  }, {})
}

export interface KeyframeTargetSummary {
  id: string
  name: string
  children: {
    [name: string]: number
  }
}

const boneLabelChildren = [
  'translateX',
  'translateY',
  'rotate',
  'scaleX',
  'scaleY',
]

function getIndexList(target: IdMap<unknown>, list: string[]): IdMap<number> {
  return list
    .filter((key) => target[key])
    .reduce<IdMap<number>>((p, key, i) => {
      p[key] = i
      return p
    }, {})
}

export function getKeyframeBoneSummary(
  bone: Bone,
  keyframeProps: { [key: string]: unknown } = {}
): KeyframeTargetSummary {
  return {
    id: bone.id,
    name: bone.name,
    children: getIndexList(keyframeProps, boneLabelChildren),
  }
}

const constraintLabelChildren = ['influence']

export function getKeyframeConstraintSummary(
  bone: Bone,
  constraint: BoneConstraint,
  keyframeProps: { [key: string]: unknown } = {}
): KeyframeTargetSummary {
  return {
    id: constraint.id,
    name: `${bone.name}:${constraint.name}`,
    children: getIndexList(keyframeProps, constraintLabelChildren),
  }
}

export function getTargetTopMap(
  summaryList: KeyframeTargetSummary[],
  keyframeExpandedMap: IdMap<boolean>,
  labelHeight: number,
  paddingIndex: number = 0
) {
  let current = paddingIndex * labelHeight
  return summaryList.reduce<IdMap<number>>((p, summary) => {
    p[summary.id] = current
    current =
      current +
      labelHeight *
        (keyframeExpandedMap[summary.id]
          ? Object.keys(summary.children).length + 1
          : 1)
    return p
  }, {})
}

export const GRAPH_NODE_HEAD_HEIGHT = 30
export const GRAPH_NODE_ROW_HEIGHT = 20

export function getGraphNodeRect(
  getGraphNodeModule: GetGraphNodeModule,
  node: GraphNode
): IRectangle {
  return {
    x: node.position.x,
    y: node.position.y,
    ...getGraphNodeSize(getGraphNodeModule, node),
  }
}

export function getGraphNodeSize(
  getGraphNodeModule: GetGraphNodeModule,
  node: GraphNode
): Size {
  const inputsHeight = getGraphNodeInputsHeight(Object.keys(node.inputs).length)

  const nodeModule = getGraphNodeModule(node.type)
  if (!nodeModule) {
    return { width: 100, height: GRAPH_NODE_HEAD_HEIGHT + inputsHeight }
  }

  const dataHeight = getGraphNodeDataHeight(nodeModule.struct)
  const outputsHeight = getGraphNodeOutputsHeight(
    Object.keys(nodeModule.struct.outputs).length
  )

  return {
    width: nodeModule.struct.width,
    height:
      GRAPH_NODE_HEAD_HEIGHT +
      Math.max(outputsHeight + dataHeight + inputsHeight, 20),
  }
}

function getGraphNodeDataHeight(nodeStruct: NodeStruct<any>): number {
  const values = Object.values(nodeStruct.data)
  return values.length === 0
    ? 0
    : values.reduce<number>((p, d) => {
        return p + getGraphNodeDataUnitHeight((d as any).type)
      }, 0)
}

function getGraphNodeInputsHeight(count: number): number {
  return count === 0 ? 0 : GRAPH_NODE_ROW_HEIGHT * (0.3 + count)
}

function getGraphNodeOutputsHeight(count: number): number {
  return count === 0 ? 0 : GRAPH_NODE_ROW_HEIGHT * (0.5 + count)
}

export function getGraphNodeDataPosition(
  getGraphNodeModule: GetGraphNodeModule,
  node: GraphNode
): {
  [key in keyof NodeStruct<GraphNode>['data']]?: IVec2
} {
  const nodeModule = getGraphNodeModule(node.type)
  if (!nodeModule) return {}

  const outputsHeight = getGraphNodeOutputsHeight(
    Object.keys(nodeModule.struct.outputs).length
  )
  let current = GRAPH_NODE_HEAD_HEIGHT + outputsHeight

  return Object.entries(nodeModule.struct.data).reduce<{
    [key: string]: IVec2
  }>((p, [key, d]) => {
    p[key] = { x: 8, y: current }
    current = current + getGraphNodeDataUnitHeight((d as any).type)
    return p
  }, {})
}

function getGraphNodeInputsPosition(
  getGraphNodeModule: GetGraphNodeModule,
  node: GraphNode
): {
  [key: string]: GraphNodeEdgeInfo
} {
  const nodeModule: NodeModule<any> | undefined = getGraphNodeModule(node.type)

  const dataHeight = nodeModule ? getGraphNodeDataHeight(nodeModule.struct) : 0
  const outputsHeight = nodeModule
    ? getGraphNodeOutputsHeight(Object.keys(nodeModule.struct.outputs).length)
    : 0
  const base = {
    x: 0,
    y:
      node.type === 'reroute'
        ? GRAPH_NODE_ROW_HEIGHT / 2
        : GRAPH_NODE_HEAD_HEIGHT +
          outputsHeight +
          dataHeight +
          GRAPH_NODE_ROW_HEIGHT / 2,
  }

  return getGraphNodeRowsPosition(
    nodeModule?.struct,
    Object.entries(getNodeEdgeTypes(getGraphNodeModule, node).inputs).map(
      ([key, type]) => ({
        key,
        type,
      })
    ),
    base
  )
}

function getGraphNodeOutputsPosition(
  getGraphNodeModule: GetGraphNodeModule,
  node: GraphNode
): {
  [key: string]: GraphNodeEdgeInfo
} {
  const nodeModule = getGraphNodeModule(node.type)
  if (!nodeModule) return {}

  const base = {
    x: getGraphNodeSize(getGraphNodeModule, node).width,
    y:
      node.type === 'reroute'
        ? GRAPH_NODE_ROW_HEIGHT / 2
        : GRAPH_NODE_HEAD_HEIGHT + (GRAPH_NODE_ROW_HEIGHT * 2) / 3,
  }

  return getGraphNodeRowsPosition(
    nodeModule.struct,
    Object.entries(getNodeEdgeTypes(getGraphNodeModule, node).outputs).map(
      ([key, type]) => ({
        key,
        type,
      })
    ),
    base,
    true
  )
}

export function getGraphNodeEdgePosition(
  getGraphNodeModule: GetGraphNodeModule,
  node: GraphNode
): {
  inputs: { [key: string]: GraphNodeEdgeInfo }
  outputs: { [key: string]: GraphNodeEdgeInfo }
} {
  const inputs = getGraphNodeInputsPosition(getGraphNodeModule, node)
  const outputs = getGraphNodeOutputsPosition(getGraphNodeModule, node)
  return { inputs, outputs }
}

function getGraphNodeRowsPosition(
  struct: NodeStruct<any> | undefined,
  rows: { key: string; type: ValueType }[],
  margin: IVec2 = { x: 0, y: 0 },
  output = false
): {
  [key: string]: GraphNodeEdgeInfo
} {
  return rows.reduce<{ [key: string]: GraphNodeEdgeInfo }>(
    (p, { key, type }, i) => {
      p[key] = {
        p: add(margin, { x: 0, y: GRAPH_NODE_ROW_HEIGHT * i }),
        type,
        label: getLabelFromStruct(struct, key, output) ?? key,
      }
      return p
    },
    {}
  )
}

function getLabelFromStruct(
  struct: NodeStruct<any> | undefined,
  key: string,
  output = false
): string | undefined {
  if (output) {
    return struct?.outputs[key] ? struct.outputs[key].label : 'UNKNOWN'
  } else {
    return struct?.inputs[key] ? struct.inputs[key].label : 'UNKNOWN'
  }
}

function getGraphNodeDataUnitHeight(
  type: keyof typeof GRAPH_VALUE_TYPE
): number {
  switch (type) {
    case 'SCALER':
      return 48
    default:
      return 48
  }
}

export const GRAPH_NODE_TYPE_COLOR: { [key in GRAPH_VALUE_TYPE_KEY]: string } =
  {
    BOOLEAN: '#b22222',
    SCALER: '#555',
    VECTOR2: '#daa520',
    TRANSFORM: '#a0522d',
    BONE: '#4b0082',
    OBJECT: '#ee82ee',
    COLOR: '#32cd32',
    TEXT: '#808000',
    D: '#00bfff',
    STOP: '#8b008b',
    GENERICS: '#b0c4de',
    INPUT: '#ff7f50',
    OUTPUT: '#df7698',
    UNKNOWN: '#fff',
  } as const

export function getInputValuePreviewText(
  valueType: ValueType,
  value: any
): string {
  switch (valueType.type) {
    case GRAPH_VALUE_TYPE.OBJECT:
      return truncate(value, 6)
    case GRAPH_VALUE_TYPE.SCALER: {
      const enumKey = (valueType as ValueTypeScaler).enumKey
      return enumKey ? getGraphValueEnumKey(enumKey, value) : truncate(value, 6)
    }
    case GRAPH_VALUE_TYPE.VECTOR2:
      return `${truncate(value.x, 4)}, ${truncate(value.y, 4)}`
    case GRAPH_VALUE_TYPE.BOOLEAN:
      return value ? 'true' : 'false'
    case GRAPH_VALUE_TYPE.COLOR:
      return rednerRGBA(hsvaToRgba(posedHsva(value)))
    case GRAPH_VALUE_TYPE.D:
      return truncate(value.join(' '), 6)
    default:
      return ''
  }
}

export function truncate(val: number | string, count: number): string {
  const str = val.toString()
  return str.length <= count ? str : str.slice(0, count) + '..'
}
