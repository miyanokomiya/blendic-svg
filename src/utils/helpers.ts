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

import { IVec2, IRectangle, isZero, add } from 'okageo'
import { Size } from 'okanvas'
import { IdMap, Bone, ElementNodeAttributes, Transform } from '../models/index'
import { GraphNode, GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import { BoneConstraint } from '/@/utils/constraints'
import { getGraphNodeModule } from '/@/utils/graphNodes'
import { NodeStruct } from '/@/utils/graphNodes/core'

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
  scale: number,
  axis: 'x' | 'y',
  viewCanvasRect: IRectangle,
  editStartPoint: IVec2
) {
  const base = { strokeWidth: scale }
  if (axis === 'x')
    return {
      ...base,
      from: { x: viewCanvasRect.x, y: editStartPoint.y },
      to: {
        x: viewCanvasRect.x + viewCanvasRect.width,
        y: editStartPoint.y,
      },
      stroke: 'red',
    }
  else
    return {
      ...base,
      from: { x: editStartPoint.x, y: viewCanvasRect.y },
      to: {
        x: editStartPoint.x,
        y: viewCanvasRect.y + viewCanvasRect.height,
      },
      stroke: 'green',
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

export const GRAPH_NODE_HEAD_HEIGHT = 40
export const GRAPH_NODE_ROW_HEIGHT = 20
const GRAPH_NODE_ROW_MARGIN = 4

export function getGraphNodeSize(node: GraphNode): Size {
  const dataHeight = getGraphNodeDataHeight(node)
  const inputsHeight = getGraphNodeInputsHeight(node)
  const outputsHeight = getGraphNodeOutputsHeight(node)

  return {
    width: getGraphNodeWidth(node),
    height: GRAPH_NODE_HEAD_HEIGHT + outputsHeight + dataHeight + inputsHeight,
  }
}

function getGraphNodeDataHeight(node: GraphNode): number {
  const module = getGraphNodeModule(node.type)
  return Object.values(module.struct.data).reduce<number>((p, d) => {
    return p + getGraphNodeDataSize(d.type).height
  }, 0)
}

function getGraphNodeWidth(node: GraphNode): number {
  const module = getGraphNodeModule(node.type)
  return module.struct.width
}

function getGraphNodeInputsHeight(node: GraphNode): number {
  const module = getGraphNodeModule(node.type)
  return GRAPH_NODE_ROW_HEIGHT * Object.keys(module.struct.inputs).length
}

function getGraphNodeOutputsHeight(node: GraphNode): number {
  const module = getGraphNodeModule(node.type)
  return GRAPH_NODE_ROW_HEIGHT * Object.keys(module.struct.outputs).length
}

export function getGraphNodeDataPosition(node: GraphNode): {
  [key in keyof NodeStruct<GraphNode>['data']]?: IVec2
} {
  const outputsHeight = getGraphNodeOutputsHeight(node)
  const module = getGraphNodeModule(node.type)
  return Object.entries(module.struct.data).reduce<{
    [key: string]: IVec2
  }>((p, [key, d]) => {
    p[key] = add(
      { x: 0, y: outputsHeight },
      { x: 8, y: getGraphNodeDataSize(d.type).height }
    )
    return p
  }, {})
}

export function getGraphNodeInputsPosition(node: GraphNode): {
  [key: string]: IVec2
} {
  const dataHeight = getGraphNodeDataHeight(node)
  const outputsHeight = getGraphNodeOutputsHeight(node)
  const module = getGraphNodeModule(node.type)
  return getGraphNodeRowsPosition(Object.keys(module.struct.inputs), {
    x: 0,
    y:
      GRAPH_NODE_HEAD_HEIGHT +
      dataHeight +
      GRAPH_NODE_ROW_MARGIN +
      outputsHeight,
  })
}

export function getGraphNodeOutputsPosition(node: GraphNode): {
  [key: string]: IVec2
} {
  const module = getGraphNodeModule(node.type)
  const { width } = getGraphNodeSize(node)
  return getGraphNodeRowsPosition(Object.keys(module.struct.outputs), {
    x: width,
    y: GRAPH_NODE_HEAD_HEIGHT,
  })
}

function getGraphNodeRowsPosition(
  keys: string[],
  margin: IVec2 = { x: 0, y: 0 }
): {
  [key: string]: IVec2
} {
  return keys.reduce<{ [key: string]: IVec2 }>((p, key, i) => {
    p[key] = add(margin, {
      x: 0,
      y: GRAPH_NODE_ROW_HEIGHT * i,
    })
    return p
  }, {})
}

function getGraphNodeDataSize(type: keyof typeof GRAPH_VALUE_TYPE): Size {
  switch (type) {
    case 'SCALER':
      return { width: 120, height: 40 }
    default:
      return { width: 120, height: 40 }
  }
}
