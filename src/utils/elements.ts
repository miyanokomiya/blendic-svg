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
  Transform,
} from '../models'
import { extractMap, mapReduce, toKeyListMap, toList } from './commons'
import { useCache } from '/@/composables/cache'
import { GraphNodeMap } from '/@/models/graphNode'
import { multiPoseTransform } from '/@/utils/armatures'
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

  const mapByParentCache = useCache(() => {
    return toKeyListMap(toList(graphElementMap), 'parent')
  })

  function addElement(elm: GraphObject) {
    graphElementMap[elm.id] = elm
    mapByParentCache.update()
  }

  function execRecursively(parent: string, fn: (elm: GraphObject) => void) {
    const children = mapByParentCache.getValue()[parent]
    if (!children) return
    children.forEach((elm) => {
      fn(elm)
      execRecursively(elm.id, fn)
    })
  }

  function getAllNestedChildren(parent: string): GraphObject[] {
    const children = mapByParentCache.getValue()[parent]
    if (!children) return []

    return [...children, ...children.flatMap((c) => getAllNestedChildren(c.id))]
  }

  function createClone(
    objectId: string,
    arg: Partial<GraphObject> = {}
  ): GraphObject | undefined {
    const src = graphElementMap[objectId]
    if (!src) return

    // set 'create: true' if the target is created object
    // set 'clone: true' if the target has native element
    const cloned = getGraphObject(
      src.create ? { ...src, ...arg } : { ...src, ...arg, clone: true },
      !arg.id
    )
    return cloned
  }

  function createCloneList(
    elements: GraphObject[],
    idPrefx?: string
  ): GraphObject[] {
    const clonedMapBySrcId = elements.reduce<IdMap<GraphObject>>(
      (p, elm, i) => {
        const cloned = createClone(
          elm.id,
          idPrefx ? { id: `${idPrefx}_clone_${i}` } : undefined
        )
        if (cloned) {
          p[elm.id] = cloned
        }
        return p
      },
      {}
    )
    return toList(clonedMapBySrcId).map((c) => {
      if (!c.parent || !clonedMapBySrcId[c.parent]) return c
      // immigrate cloned parent
      return { ...c, parent: clonedMapBySrcId[c.parent].id }
    })
  }

  return {
    setTransform(objectId, transform, inherit = false) {
      const target = graphElementMap[objectId]
      if (!target) return

      if (inherit && target.transform && transform) {
        target.transform = multiPoseTransform(target.transform, transform)
      } else {
        target.transform = transform
      }
    },
    getTransform(objectId): Transform | undefined {
      if (!graphElementMap[objectId]) return
      return graphElementMap[objectId].transform
    },
    setFill(objectId, transform) {
      if (!graphElementMap[objectId]) return
      graphElementMap[objectId].fill = transform
      execRecursively(objectId, (elm) => {
        elm.fill = transform
      })
    },
    setStroke(objectId, transform) {
      if (!graphElementMap[objectId]) return
      graphElementMap[objectId].stroke = transform
      execRecursively(objectId, (elm) => {
        elm.stroke = transform
      })
    },
    setAttributes(objectId, attributes, replace = false) {
      if (!graphElementMap[objectId]) return
      graphElementMap[objectId].attributes = replace
        ? attributes
        : { ...graphElementMap[objectId].attributes, ...attributes }
    },
    getFrame() {
      return currentFrame
    },
    getObjectMap() {
      return graphElementMap
    },
    cloneObject(objectId, arg = {}, idPref?: string) {
      const src = graphElementMap[objectId]
      if (!src) return ''

      // clone the target and its children recursively
      const clonedList = createCloneList(
        [src, ...getAllNestedChildren(objectId)],
        idPref
      )
      clonedList.forEach(addElement)

      const cloned = graphElementMap[clonedList[0].id]
      graphElementMap[cloned.id] = { ...cloned, ...arg }
      return cloned.id
    },
    createCloneGroupObject(objectId, arg = {}) {
      const src = graphElementMap[objectId]
      if (!src) return ''

      const group = getGraphObject(
        {
          ...arg,
          tag: 'g',
          elementId: src.elementId,
          clone: false,
          create: true,
        },
        !arg.id
      )
      addElement(group)
      return group.id
    },
    createObject(tag, arg = {}) {
      // genereate new id if it has not been set
      const created = getGraphObject({ ...arg, tag, create: true }, !arg.id)
      addElement(created)
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
