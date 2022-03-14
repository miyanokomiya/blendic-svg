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
  Bone,
} from '../models'
import { extractMap, mapReduce, toKeyListMap, toList } from './commons'
import { useCache } from '/@/composables/cache'
import { GraphNodeMap } from '/@/models/graphNode'
import { multiPoseTransform } from '/@/utils/armatures'
import { GetGraphNodeModule, resolveAllNodes } from '/@/utils/graphNodes'
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

export function parseFromSvg(svgText: string): {
  actor: Actor
  elements: BElement[]
} {
  const domParser = new DOMParser()
  const svgDom = domParser.parseFromString(svgText, 'image/svg+xml')
  const svgTags = svgDom.getElementsByTagName('svg')
  if (!svgTags || svgTags.length === 0) throw new Error('Not found SVG tag.')
  const svg = svgTags[0] as SVGElement

  const viewBox = parseViewBox(svg)
  const svgTree = parseElementNode(svg)

  const elements = toBElements(svgTree)

  return {
    actor: getActor(
      { svgTree, viewBox, elements: elements.map((elm) => elm.id) },
      true
    ),
    elements,
  }
}

export function initializeBElements(
  svgTree: ElementNode,
  elements: BElement[]
): BElement[] {
  const oldMap = toMap(elements)
  const parsed = toBElements(svgTree)
  return parsed.map((elm) => ({ ...(oldMap[elm.id] ?? {}), ...elm }))
}

export function toBElements(
  tree: ElementNode | string,
  parentId?: string,
  index = 0
): BElement[] {
  if (isPlainText(tree)) return []
  return [
    toBElement(tree, parentId, index),
    ...tree.children.flatMap((c, i) => toBElements(c, tree.id, i)),
  ]
}

export function toBElement(
  node: ElementNode,
  parentId?: string,
  index = 0
): BElement {
  return getBElement({ id: node.id, tag: node.tag, parentId, index })
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

export function cleanActors(
  actors: Actor[],
  elements: BElement[],
  armatures: Armature[],
  bones: Bone[]
): { actors: Actor[]; elements: BElement[] } {
  const elementMap = toMap(elements)
  const armatureMap = toMap(armatures)
  const boneMap = toMap(bones)
  const boneMapByArmatureId = mapReduce(armatureMap, (a) =>
    toMap(a.bones.map((id) => boneMap[id]))
  )

  const cleanedActors = actors.map((act) => {
    const arm = armatureMap[act.armatureId]
    return arm ? act : { ...act, armatureId: '' }
  })
  const cleanedElements = cleanedActors.flatMap((act) => {
    const boneMap = act.armatureId ? boneMapByArmatureId[act.armatureId] : {}
    return act.elements.map((elmId) => {
      const elm = elementMap[elmId]
      if (!elm.boneId) return elm
      return boneMap[elm.boneId] ? elm : { ...elm, boneId: '' }
    })
  })

  return { actors: cleanedActors, elements: cleanedElements }
}

export function cleanGraphs(graphs: AnimationGraph[]): AnimationGraph[] {
  // TODO: check armatureId, objectId
  return graphs
}

export function inheritWeight(
  old: { actor: Actor; elements: BElement[] },
  next: { actor: Actor; elements: BElement[] }
): { actor: Actor; elements: BElement[] } {
  const oldMap = toMap(old.elements)
  const nextMap = toMap(next.elements)
  const elements = toList({
    ...toMap(next.elements),
    ...extractMap(oldMap, nextMap),
  })
  return {
    actor: { ...next.actor, armatureId: old.actor.armatureId },
    elements,
  }
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

function toGraphObject(e: BElement): GraphObject {
  return getGraphObject({
    id: e.id,
    elementId: e.id,
    tag: e.tag,
    parent: e.parentId,
    index: e.index,
  })
}

export function createGraphNodeContext(
  elementMap: IdMap<BElement>,
  boneMap: IdMap<{ id: string; transform: Transform }>,
  frameInfo: { currentFrame: number; endFrame: number }
): NodeContext<GraphObject> {
  const graphElementMap: IdMap<GraphObject> = mapReduce(
    elementMap,
    toGraphObject
  )

  const mapByParentCache = useCache(() => {
    return toKeyListMap(toList(graphElementMap), 'parent')
  })

  function getChildrenSize(id: string): number {
    const children = mapByParentCache.getValue()[id]
    if (!children) return 0
    return children.length
  }

  function getChildId(id: string, index: number): string | undefined {
    if (index < 0) return
    const children = mapByParentCache.getValue()[id]
    if (!children) return
    return children[index]?.id
  }

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

    const id = arg.id ? getNewId(arg.id) : undefined
    // set 'create: true' if the target is created object
    // set 'clone: true' if the target has native element
    const cloned = getGraphObject(
      src.create ? { ...src, ...arg, id } : { ...src, ...arg, id, clone: true },
      !id
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

  const namespaces: string[] = []

  function getNewId(id = ''): string {
    return namespaces.length > 0 ? `${namespaces.join('-')}-${id}` : id
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
    setFill(objectId, fill: Transform | string) {
      if (!graphElementMap[objectId]) return
      graphElementMap[objectId].fill = fill
      execRecursively(objectId, (elm) => {
        elm.fill = fill
      })
    },
    setStroke(objectId, stroke: Transform | string) {
      if (!graphElementMap[objectId]) return
      graphElementMap[objectId].stroke = stroke
      execRecursively(objectId, (elm) => {
        elm.stroke = stroke
      })
    },
    setAttributes(objectId, attributes, replace = false) {
      if (!graphElementMap[objectId]) return
      graphElementMap[objectId].attributes = replace
        ? attributes
        : { ...graphElementMap[objectId].attributes, ...attributes }
    },
    getFrameInfo() {
      return frameInfo
    },
    getBoneMap() {
      return boneMap
    },
    getObjectMap() {
      return graphElementMap
    },
    getChildId,
    getChildrenSize,
    cloneObject(objectId, arg = {}, idPref?: string) {
      const src = graphElementMap[objectId]
      if (!src) return ''

      // clone the target and its children recursively
      const clonedList = createCloneList(
        [src, ...getAllNestedChildren(objectId)],
        idPref
      )

      const clonedRoot = clonedList[0]
      Object.entries(arg).forEach(([key, value]) => {
        ;(clonedRoot as any)[key] = value
      })
      clonedRoot.index = src.parent ? getChildrenSize(src.parent) : 0
      clonedList.forEach(addElement)

      return clonedRoot.id
    },
    createCloneGroupObject(objectId, arg = {}) {
      const src = graphElementMap[objectId]
      if (!src) return ''

      const id = arg.id ? getNewId(arg.id) : undefined
      const parent = src.parent
      const index = parent ? getChildrenSize(parent) : 0
      const group = getGraphObject(
        {
          ...arg,
          id,
          tag: 'g',
          elementId: src.elementId,
          clone: false,
          create: true,
          index,
          parent,
        },
        !id
      )
      addElement(group)
      return group.id
    },
    createObject(tag, arg = {}) {
      const id = arg.id ? getNewId(arg.id) : undefined
      const parent = arg.parent
      const index = parent ? getChildrenSize(parent) : 0
      // genereate new id if it has not been set
      const created = getGraphObject(
        { ...arg, id, tag, create: true, index },
        !id
      )
      addElement(created)
      return created.id
    },
    beginNamespace<T>(name: string, operation: () => T): T {
      namespaces.push(name)
      const result = operation()
      namespaces.pop()
      return result
    },
  }
}

export function resolveAnimationGraph(
  getGraphNodeModule: GetGraphNodeModule,
  elementMap: IdMap<BElement>,
  boneMap: IdMap<{ id: string; transform: Transform }>,
  frameInfo: { currentFrame: number; endFrame: number },
  graphNodes: GraphNodeMap
): IdMap<GraphObject> {
  const context = createGraphNodeContext(elementMap, boneMap, frameInfo)
  resolveAllNodes(getGraphNodeModule, context, graphNodes)
  return context.getObjectMap()
}

export function isPlainText(elm: unknown): elm is string {
  return typeof elm === 'string'
}
