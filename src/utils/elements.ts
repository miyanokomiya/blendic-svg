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

import { IRectangle } from 'okageo'
import {
  Actor,
  GraphObject,
  Armature,
  BElement,
  ElementNode,
  getActor,
  getBElement,
  getElementNode,
  getGraphObject,
  IdMap,
  toMap,
  AnimationGraph,
} from '../models'
import { extractMap, mapReduce, toList } from './commons'
import { GraphNodeMap } from '/@/models/graphNode'
import { resolveAllNodes } from '/@/utils/graphNodes'
import { NodeContext } from '/@/utils/graphNodes/core'
import { TreeNode } from '/@/utils/relations'

export function getPlainSvgTree(): ElementNode {
  return getElementNode({
    id: 'svg',
    tag: 'svg',
    attributes: {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 400 400',
      'font-family': 'sans-serif',
    },
  })
}

export function parseFromSvg(svgText: string): Actor {
  const domParser = new DOMParser()
  const svgDom = domParser.parseFromString(svgText, 'image/svg+xml')
  const svgTags = svgDom.getElementsByTagName('svg')
  if (!svgTags || svgTags.length === 0) throw new Error('Not found SVG tag.')
  const svg = svgTags[0] as SVGElement

  const viewBox = parseViewBox(svg)
  const svgTree = parseElementNode(svg)

  return getActor({ svgTree, viewBox, elements: toBElements(svgTree) }, true)
}

function toBElements(tree: ElementNode | string): BElement[] {
  if (isPlainText(tree)) return []
  return [toBElement(tree), ...tree.children.flatMap(toBElements)]
}

function toBElement(node: ElementNode): BElement {
  return getBElement({ id: node.id })
}

function parseElementNode(parentElm: SVGElement): ElementNode {
  const id = parentElm.id
  return getElementNode(
    {
      id,
      // NOTE: case-sensitive e.g. <foreignObject>
      tag: parentElm.tagName,
      attributes: Array.from(parentElm.attributes).reduce<{
        [name: string]: string
      }>((p, c) => ({ ...p, [c.name]: c.value }), {}),
      children: parseHTMLCollection(parentElm.childNodes),
    },
    !id
  )
}

function parseHTMLCollection(
  collection: NodeListOf<ChildNode>
): (ElementNode | string)[] {
  return Array.from(collection)
    .map((c) => {
      if (c.nodeName === '#text') {
        return c.nodeValue?.trim() || ''
      }
      return parseElementNode(c as SVGElement)
    })
    .filter((c) => !!c)
}

function parseViewBox(root: SVGElement): IRectangle | undefined {
  const viewBox = root.getAttribute('viewBox')
  return parseViewBoxFromStr(viewBox || undefined)
}

export function parseViewBoxFromStr(value?: string): IRectangle | undefined {
  if (!value) return

  const list = value.split(/ +/).map((s) => parseFloat(s))
  if (list.length < 4) return

  return {
    x: list[0],
    y: list[1],
    width: list[2],
    height: list[3],
  }
}

export function cleanActors(actors: Actor[], armatures: Armature[]): Actor[] {
  const armatureMap = toMap(armatures)
  return actors.map((act) => {
    const arm = armatureMap[act.armatureId]
    const boneMap = toMap(arm?.bones ?? [])

    return {
      ...act,
      armatureId: arm ? act.armatureId : '',
      elements: act.elements.map((e) => ({
        ...e,
        boneId: boneMap[e.boneId] ? e.boneId : '',
      })),
    }
  })
}

export function cleanGraphs(graphs: AnimationGraph[]): AnimationGraph[] {
  // TODO: check armatureId, objectId
  return graphs
}

export function inheritWeight(old: Actor, next: Actor): Actor {
  const oldMap = toMap(old.elements)
  const nextMap = toMap(next.elements)
  const elements = toList({
    ...toMap(next.elements),
    ...extractMap(oldMap, nextMap),
  })
  return { ...next, armatureId: old.armatureId, elements }
}

export function flatElementTree(
  children: (ElementNode | string)[]
): ElementNode[] {
  const filtered = children.filter((n): n is ElementNode => !isPlainText(n))
  return filtered.concat(filtered.flatMap((c) => flatElementTree(c.children)))
}

export function testEditableTag(tag: string): boolean {
  return !/defs|metadata|namedview|script|style|tspan/.test(tag.toLowerCase())
}

export function getElementLabel(element: ElementNode): string {
  return `${element.tag} #${element.id}`
}

export function getTreeFromElementNode(svg: ElementNode): TreeNode {
  return {
    id: svg.id,
    name: getElementLabel(svg),
    children: svg.children
      .filter((c): c is ElementNode => !isPlainText(c))
      .filter((c) => testEditableTag(c.tag))
      .map(getTreeFromElementNode),
  }
}

export function createGraphNodeContext(
  elementMap: IdMap<BElement>,
  currentFrame: number
): NodeContext<GraphObject> {
  const graphElementMap: IdMap<GraphObject> = mapReduce(elementMap, (e) =>
    getGraphObject({ id: e.id, elementId: e.id })
  )

  return {
    setTransform(objectId, transform) {
      if (!graphElementMap[objectId]) return
      graphElementMap[objectId].transform = transform
    },
    setFill(objectId, transform) {
      if (!graphElementMap[objectId]) return
      graphElementMap[objectId].fill = transform
    },
    setStroke(objectId, transform) {
      if (!graphElementMap[objectId]) return
      graphElementMap[objectId].stroke = transform
    },
    getFrame() {
      return currentFrame
    },
    getObjectMap() {
      return graphElementMap
    },
    cloneObject(objectId) {
      const src = graphElementMap[objectId]
      if (!src) return ''

      // set 'create: true' if the target is created object
      // set 'clone: true' if the target has native element
      const cloned = getGraphObject(
        src.create ? src : { ...src, clone: true },
        true
      )
      graphElementMap[cloned.id] = cloned
      return cloned.id
    },
    createObject(tag, arg) {
      const created = getGraphObject({ ...arg, tag, create: true }, true)
      graphElementMap[created.id] = created
      return created.id
    },
  }
}

export function resolveAnimationGraph(
  elementMap: IdMap<BElement>,
  currentFrame: number,
  graphNodes: GraphNodeMap
): IdMap<GraphObject> {
  const context = createGraphNodeContext(elementMap, currentFrame)
  resolveAllNodes(context, graphNodes)
  return context.getObjectMap()
}

export function isPlainText(elm: unknown): elm is string {
  return typeof elm === 'string'
}
