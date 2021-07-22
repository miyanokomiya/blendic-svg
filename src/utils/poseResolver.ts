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

import {
  AffineMatrix,
  affineToTransform,
  IDENTITY_AFFINE,
  invertTransform,
  multiAffines,
  parseTransform,
} from 'okageo'
import {
  BElement,
  Bone,
  ElementNode,
  IdMap,
  Transform,
  getTransform,
  ElementNodeAttributes,
  toMap,
  GraphObject,
  getElementNode,
} from '../models'
import { boneToAffine, getTransformedBoneMap } from './armatures'
import { mapFilter, mapReduce, toKeyListMap } from './commons'
import { getTnansformStr, parseStyle, toStyle, viewbox } from './helpers'
import { KeyframeBase } from '/@/models/keyframe'
import {
  getPosedAttributesWithoutTransform,
  posedColorAttributes,
} from '/@/utils/attributesResolver'
import { flatElementTree, isPlainText } from '/@/utils/elements'
import { isIdentityAffine, transformToAffine } from '/@/utils/geometry'
import { splitKeyframeMapByName } from '/@/utils/keyframes'
import { getInterpolatedTransformMapByTargetId } from '/@/utils/keyframes/keyframeBone'
import * as keyframeConstraint from '/@/utils/keyframes/keyframeConstraint'

export type TransformCache = {
  [relativeRootTargetId: string]: { [boneId: string]: Transform }
}

export function toTransformStr(
  originalTransformStr?: string,
  poseTransform?: Transform
): string {
  const posedTransformStr = poseTransform ? getTnansformStr(poseTransform) : ''
  // this order of transformations is important
  return posedTransformStr + (originalTransformStr ?? '')
}

// return zero affine matrix if arg can not be inverted
export function invertTransformOrZero(m: AffineMatrix): AffineMatrix {
  if (m[0] * m[3] - m[1] * m[2] === 0) return [0, 0, 0, 0, 0, 0]
  return invertTransform(m)
}

export function getPoseDeformMatrix(
  spacePoseMatrix?: AffineMatrix,
  selfPoseMatrix?: AffineMatrix,
  elementSpaceMatrix?: AffineMatrix
): AffineMatrix {
  return multiAffines(
    [
      elementSpaceMatrix
        ? invertTransformOrZero(elementSpaceMatrix)
        : undefined,
      spacePoseMatrix ? invertTransformOrZero(spacePoseMatrix) : undefined,
      selfPoseMatrix,
    ].filter((m): m is AffineMatrix => !!m)
  )
}

export function getNativeDeformMatrix(
  elementSpaceMatrix?: AffineMatrix,
  elementSlefMatrix?: AffineMatrix
): AffineMatrix {
  return multiAffines(
    [elementSpaceMatrix, elementSlefMatrix].filter(
      (m): m is AffineMatrix => !!m
    )
  )
}

export function getPosedElementTree(
  boneMap: IdMap<Bone>,
  elementMap: IdMap<BElement>,
  svgTree: ElementNode
): ElementNode {
  const transformMap = getPosedElementMatrixMap(
    boneMap,
    elementMap,
    svgTree,
    undefined,
    undefined
  )

  return getPosedElementNode(boneMap, transformMap, elementMap, svgTree)
}

export function getPosedElementMatrixMap(
  boneMap: IdMap<Bone>,
  elementMap: IdMap<BElement>,
  node: ElementNode,
  relativeRootTargetId = '',
  spaceNativeMatrix = IDENTITY_AFFINE
): IdMap<AffineMatrix> {
  const bElement = elementMap[node.id]
  const spacePoseMatrix =
    getSelfPoseMatrix(boneMap, relativeRootTargetId) ?? IDENTITY_AFFINE
  const boundTargetId = bElement?.boneId || relativeRootTargetId
  const selfPoseMatrix = getSelfPoseMatrix(boneMap, boundTargetId)
  const nativeMatrix = getnativeMatrix(node, spaceNativeMatrix)

  const transform = multiAffines(
    [
      getPoseDeformMatrix(spacePoseMatrix, selfPoseMatrix, spaceNativeMatrix),
      nativeMatrix,
    ].filter((m): m is AffineMatrix => !!m)
  )

  return {
    [node.id]: transform,
    ...node.children.reduce<IdMap<AffineMatrix>>((p, c) => {
      if (isPlainText(c)) return p
      p = {
        ...p,
        ...getPosedElementMatrixMap(
          boneMap,
          elementMap,
          c,
          boundTargetId,
          nativeMatrix
        ),
      }
      return p
    }, {}),
  }
}

function getPosedAttributes(
  boneMap: IdMap<Bone>,
  matrix: AffineMatrix | undefined,
  element: BElement,
  node: ElementNode
): ElementNodeAttributes {
  const ret: ElementNodeAttributes = getPosedAttributesWithoutTransform(
    boneMap,
    element,
    node
  )
  if (matrix && !isIdentityAffine(matrix)) {
    ret.transform = affineToTransform(matrix)
  }

  return ret
}

function getPosedElementNode(
  boneMap: IdMap<Bone>,
  matrixMap: IdMap<AffineMatrix>,
  elementMap: IdMap<BElement>,
  node: ElementNode
): ElementNode {
  const attributes = getPosedAttributes(
    boneMap,
    matrixMap[node.id],
    elementMap[node.id],
    node
  )

  return {
    ...node,
    attributes: {
      ...node.attributes,
      ...attributes,
    },
    children: node.children.map((c) => {
      if (isPlainText(c)) return c
      return getPosedElementNode(boneMap, matrixMap, elementMap, c)
    }),
  }
}

function getSelfPoseMatrix(boneMap: IdMap<Bone>, boundTargetId: string) {
  const b = boneMap[boundTargetId]
  return b ? boneToAffine(b) : undefined
}

function getnativeMatrix(node: ElementNode, spaceNativeMatrix: AffineMatrix) {
  return getNativeDeformMatrix(
    spaceNativeMatrix,
    node.attributes.transform
      ? parseTransform(node.attributes.transform)
      : undefined
  )
}

export function bakeKeyframes(
  keyframeMapByTargetId: IdMap<KeyframeBase[]>,
  boneMap: IdMap<Bone>,
  elementMap: IdMap<BElement>,
  svgRoot: ElementNode,
  endFrame: number
): IdMap<ElementNodeAttributes>[] {
  return [...Array(endFrame + 1)].map((_, i) => {
    return bakeKeyframe(keyframeMapByTargetId, boneMap, elementMap, svgRoot, i)
  })
}

export function getInterpolatedBoneMap(
  keyframeMapByTargetId: IdMap<KeyframeBase[]>,
  boneMap: IdMap<Bone>,
  currentFrame: number
): IdMap<Bone> {
  const splitedKeyframeMapByTargetId = splitKeyframeMapByName(
    keyframeMapByTargetId
  )

  const interpolatedTransformMap = getInterpolatedTransformMapByTargetId(
    splitedKeyframeMapByTargetId.bone,
    currentFrame
  )
  const interpolatedBoneMap = mapReduce(boneMap, (bone, id) => ({
    ...bone,
    transform: interpolatedTransformMap[id] ?? getTransform(),
  }))

  const interpolatedOptionMap =
    keyframeConstraint.getInterpolatedOptionMapByTargetId(
      splitedKeyframeMapByTargetId.constraint,
      currentFrame
    )

  return mapReduce(interpolatedBoneMap, (bone) => {
    return {
      ...bone,
      constraints: bone.constraints.map((c) => {
        if (!interpolatedOptionMap[c.id]) return c
        return {
          ...c,
          option: { ...c.option, ...interpolatedOptionMap[c.id] },
        }
      }),
    }
  })
}

export function bakeKeyframe(
  keyframeMapByTargetId: IdMap<KeyframeBase[]>,
  boneMap: IdMap<Bone>,
  elementMap: IdMap<BElement>,
  svgRoot: ElementNode,
  currentFrame: number
): IdMap<ElementNodeAttributes> {
  const resolvedBoneMap = getTransformedBoneMap(
    getInterpolatedBoneMap(keyframeMapByTargetId, boneMap, currentFrame)
  )
  const matrixMap = getPosedElementMatrixMap(
    resolvedBoneMap,
    elementMap,
    svgRoot
  )
  const nodeMap = toMap(flatElementTree([svgRoot]))

  return mapReduce(matrixMap, (matrix, nodeId) => {
    return getPosedAttributes(
      resolvedBoneMap,
      matrix,
      elementMap[nodeId],
      nodeMap[nodeId]
    )
  })
}

export function getGraphResolvedElementTree(
  graphObjectMap: IdMap<GraphObject>,
  svgTree: ElementNode
): ElementNode {
  return getGraphResolvedElement(
    graphObjectMap,
    getClonedElementsTree(
      graphObjectMap,
      getCreatedElementsTree(graphObjectMap, svgTree)
    )
  )
}

// resolve graph attributes of native elements
function getGraphResolvedElement(
  graphObjectMap: IdMap<GraphObject>,
  node: ElementNode
): ElementNode {
  const graphObject = graphObjectMap[node.id]
  // cloned origin should ignore graphObject's attributes
  const ignoreAttributes =
    !graphObject || node.attributes[DATA_CLONE_ORIGIN_KEY]

  return {
    ...node,
    attributes: ignoreAttributes
      ? node.attributes
      : getGraphResolvedAttributes(graphObject, node.attributes),
    children: node.children.map((c) => {
      if (isPlainText(c)) return c
      return getGraphResolvedElement(graphObjectMap, c)
    }),
  }
}

const NUMBER_ATTRIBUTES_KEYS: { [key: string]: boolean } = {
  x: true,
  y: true,
  dx: true,
  dy: true,
  width: true,
  height: true,
  cx: true,
  cy: true,
  rx: true,
  ry: true,
  'font-size': true,
  'stroke-dashoffset': true,

  x1: true,
  y1: true,
  x2: true,
  y2: true,
  offset: true,
}

const STRING_ATTRIBUTES_KEYS: { [key: string]: boolean } = {
  id: true,
  'text-anchor': true,
  'dominant-baseline': true,
  'stroke-dasharray': true,
  gradientUnits: true,
}

function getGraphResolvedAttributes(
  graphObject: GraphObject,
  nodeAttributes: ElementNodeAttributes
): ElementNodeAttributes {
  const ret: ElementNodeAttributes = { ...nodeAttributes }

  if (graphObject.transform) {
    ret.transform = affineToTransform(transformToAffine(graphObject.transform))
  } else if (nodeAttributes.transform) {
    ret.transform = nodeAttributes.transform
  }

  if (graphObject.fill) {
    if (typeof graphObject.fill === 'string') {
      ret.fill = `url(#${graphObject.fill})`
    } else {
      const attrs = posedColorAttributes(graphObject.fill)
      ret.fill = attrs.color
      ret['fill-opacity'] = attrs.opacity
    }
  }

  if (graphObject.stroke) {
    if (typeof graphObject.stroke === 'string') {
      ret.stroke = `url(#${graphObject.stroke})`
    } else {
      const attrs = posedColorAttributes(graphObject.stroke)
      ret.stroke = attrs.color
      ret['stroke-opacity'] = attrs.opacity
    }
  }

  if (graphObject['stroke-width']) {
    ret['stroke-width'] = graphObject['stroke-width'].toString()
  }

  if (graphObject.attributes) {
    const attrs = graphObject.attributes

    Object.entries(attrs).forEach(([key, val]) => {
      if (!val) return
      if (NUMBER_ATTRIBUTES_KEYS[key]) {
        ret[key] = val.toString()
      } else if (STRING_ATTRIBUTES_KEYS[key]) {
        ret[key] = val
      }
    })

    if (graphObject.attributes.viewBox)
      ret.viewBox = viewbox(graphObject.attributes.viewBox)

    if (graphObject.attributes.d) {
      // top command must be L, l, M or m
      const top = graphObject.attributes.d[0]?.trim()?.toLowerCase()[0]
      if (top === 'm' || top === 'l') ret.d = graphObject.attributes.d.join(' ')
    }

    if (graphObject.attributes['stop-color']) {
      const attrs = posedColorAttributes(graphObject.attributes['stop-color'])
      ret['stop-color'] = attrs.color
      ret['stop-opacity'] = attrs.opacity
    }
  }

  if (isGroupCloneRootObject(graphObject)) {
    ret[DATA_CLONE_ID_KEY_FOR_G] = graphObject.elementId!
  }

  return ret
}

export function getClonedElementsTree(
  graphObjectMap: IdMap<GraphObject>,
  svgTree: ElementNode
): ElementNode {
  const clonedObjects = Object.values(graphObjectMap).filter((o) => o.clone)
  const attributesMap: IdMap<ElementNodeAttributes> = {}
  const { tree, clonedElementIds } = convertUseTree(
    clonedObjects,
    svgTree,
    attributesMap
  )

  const convertedTree = convertGroupUseTree(graphObjectMap, tree)

  // gather all nodes having refs to cloned elements
  const useObjects = Object.keys(clonedElementIds)
    .map((id) => graphObjectMap[id])
    .concat(clonedObjects)
  return insertClonedElementTree(useObjects, convertedTree, attributesMap)
}

function insertClonedElementTree(
  useObjects: GraphObject[],
  svgTree: ElementNode,
  attributesMap: IdMap<ElementNodeAttributes>
): ElementNode {
  const useObjectMapByElementId = useObjects.reduce<IdMap<GraphObject[]>>(
    (p, o) => {
      if (!o.elementId) return p
      p[o.elementId] = p[o.elementId] ? [...p[o.elementId], o] : [o]
      return p
    },
    {}
  )
  return insertClonedElement(useObjectMapByElementId, svgTree, attributesMap)
}

const DATA_CLONE_ORIGIN_KEY = 'data-blendic-use-origin-id'
const DATA_CLONE_ID_KEY = 'data-blendic-use-id'
const DATA_CLONE_ID_KEY_FOR_G = 'data-blendic-use-id-for-g'

function createUseObject(
  obj: GraphObject,
  srcId: string,
  attributes: ElementNodeAttributes
): ElementNode {
  return {
    id: `clone_${obj.id}`,
    tag: 'use',
    attributes: {
      href: `#${srcId}`,
      'xlink:href': `#${srcId}`,
      ...getGraphResolvedAttributes(obj, attributes),
    },
    children: [],
  }
}

function insertClonedElement(
  useObjectMapByElementId: IdMap<GraphObject[]>,
  node: ElementNode,
  attributesMap: IdMap<ElementNodeAttributes>,
  // cache for performance and has sideeffect
  objsPerParentByElementId: IdMap<IdMap<GraphObject[]>> = {}
): ElementNode {
  const srcId =
    node.attributes[DATA_CLONE_ID_KEY] ||
    node.attributes[DATA_CLONE_ID_KEY_FOR_G]
  const isClonedRootG = !!node.attributes[DATA_CLONE_ID_KEY]
  const objs = useObjectMapByElementId[srcId] ?? []

  if (!objsPerParentByElementId[srcId]) {
    objsPerParentByElementId[srcId] = toKeyListMap(objs, 'parent')
  }
  const objMapByParent = objsPerParentByElementId[srcId]

  // cloned nodes with a parent must be group used nodes
  // => 'convertGroupUseTree' guarantees inserting their parents in the used location
  // - g
  //   - defs
  //     - origin node
  //   - g: group for used nodes
  //     - use: group cloned node 1
  //     - use: group cloned node 2
  //   - g: group for cloned group (recursive)
  //     - g: cloned group for used nodes
  //       - use: group cloned node 3
  //       - use: group cloned node 4
  //     - g: cloned group for used nodes
  //       - use: group cloned node 5
  //       - use: group cloned node 6
  //   - use: cloned node of origin

  const children = node.children.map((c) => {
    if (isPlainText(c)) return c

    const n = insertClonedElement(
      useObjectMapByElementId,
      c,
      attributesMap,
      objsPerParentByElementId
    )

    // drop origin if the current node is not a cloned root group
    const targetObjs =
      (isClonedRootG
        ? objMapByParent[n.id]
        : objMapByParent[n.id]?.filter((o) => o.id !== srcId)) ?? []
    return {
      ...n,
      children: [
        ...n.children,
        ...targetObjs.map((o) =>
          createUseObject(o, srcId, attributesMap[srcId])
        ),
      ],
    }
  })

  if (isClonedRootG) {
    return {
      ...node,
      children: [
        ...children,
        ...objs
          .filter((o) => !o.parent)
          .map((o) => {
            return createUseObject(o, srcId, attributesMap[srcId])
          }),
      ],
    }
  } else {
    return { ...node, children }
  }
}

function convertUseTree(
  clonedObjects: GraphObject[],
  svgTree: ElementNode,
  attributesMap: IdMap<ElementNodeAttributes>
): { tree: ElementNode; clonedElementIds: IdMap<boolean> } {
  const clonedElementIds = clonedObjects
    .map((o) => o.elementId)
    .reduce<IdMap<boolean>>((p, id) => {
      if (!id) return p
      p[id] = true
      return p
    }, {})
  return {
    tree: convertUseElement(clonedElementIds, svgTree, attributesMap),
    clonedElementIds,
  }
}

const DROP_ATTRUBTES = [
  'transform',
  'fill',
  'stroke',
  'fill-opacity',
  'stroke-opacity',
  'x',
  'y',
]

function dropOriginAttributes(
  attributes: ElementNodeAttributes
): ElementNodeAttributes {
  const ret = { ...attributes }
  DROP_ATTRUBTES.forEach((key) => {
    delete ret[key]
  })

  // drop some style properties
  const style = attributes.style
  if (style) {
    const parsed = parseStyle(style)
    delete parsed.fill
    delete parsed.stroke
    delete parsed['fill-opacity']
    delete parsed['stroke-opacity']
    const styleStr = toStyle(parsed)
    if (styleStr) {
      ret.style = styleStr
    } else {
      delete ret.style
    }
  }

  return ret
}

function convertUseElement(
  clonedElementIds: IdMap<boolean>,
  node: ElementNode,
  attributesMap: IdMap<ElementNodeAttributes>
): ElementNode {
  const children = node.children.map((c) => {
    if (isPlainText(c)) return c
    return convertUseElement(clonedElementIds, c, attributesMap)
  })

  if (clonedElementIds[node.id]) {
    attributesMap[node.id] = node.attributes

    // drop some attributes to override
    const attributes = dropOriginAttributes(node.attributes)

    // insert a defs node to be cloned
    return {
      id: `blendic_group_${node.id}`,
      tag: 'g',
      attributes: { [DATA_CLONE_ID_KEY]: node.id },
      children: [
        {
          id: '',
          tag: 'defs',
          attributes: {},
          children: [
            {
              id: node.id,
              tag: node.tag,
              attributes: {
                ...attributes,
                [DATA_CLONE_ORIGIN_KEY]: node.id,
                // must have id attribute to be referred by <use> tags
                id: node.id,
              },
              children,
            },
          ],
        },
      ],
    }
  } else {
    return { ...node, children }
  }
}

function isGroupCloneRootObject(obj: GraphObject): boolean {
  return !!obj.create && !!obj.elementId
}

export function convertGroupUseTree(
  graphObjectMap: IdMap<GraphObject>,
  svgTree: ElementNode
): ElementNode {
  const cloneGroups = mapFilter(graphObjectMap, isGroupCloneRootObject)

  // drop the group nodes and insert them to neighborhood locations of the origin nodes
  const droppedMap: IdMap<ElementNode[]> = {}
  const dropped = dropGroupUseElement(cloneGroups, svgTree, (node) => {
    const elementId = graphObjectMap[node.id].elementId!
    if (!droppedMap[elementId]) {
      droppedMap[elementId] = []
    }
    droppedMap[elementId].push(node)
  })!
  return insertGroupUseElement(droppedMap, dropped)
}

function dropGroupUseElement(
  cloneGroups: IdMap<GraphObject>,
  node: ElementNode,
  saveDroppedElement: (node: ElementNode) => void
): ElementNode | undefined {
  if (cloneGroups[node.id]) {
    saveDroppedElement(node)
    return undefined
  } else {
    const children = node.children
      .map((c) => {
        if (isPlainText(c)) return c
        return dropGroupUseElement(cloneGroups, c, saveDroppedElement)
      })
      .filter((c): c is ElementNode => !!c)

    return { ...node, children }
  }
}

function insertGroupUseElement(
  droppedMap: IdMap<ElementNode[]>,
  node: ElementNode
): ElementNode {
  const children = node.children.map((c) => {
    if (isPlainText(c)) return c
    return insertGroupUseElement(droppedMap, c)
  })

  if (node.attributes[DATA_CLONE_ID_KEY]) {
    const list = droppedMap[node.attributes[DATA_CLONE_ID_KEY]] ?? []
    return {
      ...node,
      children: [...children, ...list],
    }
  } else {
    return { ...node, children }
  }
}

export function getCreatedElementsTree(
  graphObjectMap: IdMap<GraphObject>,
  svgTree: ElementNode
): ElementNode {
  const createdObjects = Object.values(graphObjectMap)
    .filter((o) => o.create && o.tag)
    // if parent is empty, let them be svg's children
    .map((o) => {
      return o.parent ? o : { ...o, parent: svgTree.id }
    })

  const graphObjectMapByParent = toKeyListMap(createdObjects, 'parent')
  const createdElementMapByParent = mapReduce(graphObjectMapByParent, (list) =>
    list.map(createElementByGraphObject)
  )

  return insertCreatedElements(svgTree, createdElementMapByParent)
}

function createElementByGraphObject(obj: GraphObject): ElementNode {
  return getElementNode({
    id: obj.id,
    tag: obj.tag ?? 'rect',
    attributes: getGraphResolvedAttributes(obj, {}),
    children: obj.text ? [obj.text] : [],
  })
}

function insertCreatedElements(
  elm: ElementNode,
  createdElementMapByParent: IdMap<ElementNode[]>
): ElementNode {
  const srcChildren = createdElementMapByParent[elm.id]
    ? [...elm.children, ...createdElementMapByParent[elm.id]]
    : elm.children
  return {
    ...elm,
    children: [
      ...srcChildren.map((c) => {
        if (isPlainText(c)) return c
        return insertCreatedElements(c, createdElementMapByParent)
      }),
    ],
  }
}

export function addEssentialSvgAttributes(svg: ElementNode): ElementNode {
  return {
    ...svg,
    attributes: {
      ...svg.attributes,
      // for <use xlink:href="#abc" />
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    },
  }
}
