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
import { mapReduce, toKeyListMap } from './commons'
import { getTnansformStr, viewbox } from './helpers'
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
  return getClonedElementsTree(
    graphObjectMap,
    getCreatedElementsTree(
      graphObjectMap,
      getGraphResolvedElement(graphObjectMap, svgTree)
    )
  )
}

function getGraphResolvedElement(
  graphObjectMap: IdMap<GraphObject>,
  node: ElementNode
): ElementNode {
  const graphObject = graphObjectMap[node.id]

  return {
    ...node,
    attributes: getGraphResolvedAttributes(graphObject, node.attributes),
    children: node.children.map((c) => {
      if (isPlainText(c)) return c
      return getGraphResolvedElement(graphObjectMap, c)
    }),
  }
}

const NUMBER_ATTRIBUTES_KEYS: { [key: string]: boolean } = {
  x: true,
  y: true,
  width: true,
  height: true,
  cx: true,
  cy: true,
  rx: true,
  ry: true,
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
    const attrs = posedColorAttributes(graphObject.fill)
    ret.fill = attrs.color
    ret['fill-opacity'] = attrs.opacity
  }

  if (graphObject.stroke) {
    const attrs = posedColorAttributes(graphObject.stroke)
    ret.stroke = attrs.color
    ret['stroke-opacity'] = attrs.opacity
  }

  if (graphObject['stroke-width']) {
    ret['stroke-width'] = graphObject['stroke-width'].toString()
  }

  if (graphObject.attributes) {
    const attrs = graphObject.attributes

    Object.entries(attrs).forEach(([key, val]) => {
      if (NUMBER_ATTRIBUTES_KEYS[key] && val) ret[key] = val.toString()
    })

    if (graphObject.attributes.viewBox)
      ret.viewBox = viewbox(graphObject.attributes.viewBox)

    if (graphObject.attributes.d) {
      // top command must be L, l, M or m
      const top = graphObject.attributes.d[0].trim().toLowerCase()[0]
      if (top === 'm' || top === 'l') ret.d = graphObject.attributes.d.join(' ')
    }
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
  // gather all nodes having refs to cloned elements
  const useObjects = Object.keys(clonedElementIds)
    .map((id) => graphObjectMap[id])
    .concat(clonedObjects)
  return insertClonedElementTree(useObjects, tree, attributesMap)
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

const DATA_CLONE_ID_KEY = 'data-blendic-use-id'

function insertClonedElement(
  useObjectMapByElementId: IdMap<GraphObject[]>,
  node: ElementNode,
  attributesMap: IdMap<ElementNodeAttributes>
): ElementNode {
  const children = node.children.map((c) => {
    if (isPlainText(c)) return c
    return insertClonedElement(useObjectMapByElementId, c, attributesMap)
  })

  const srcId = node.attributes[DATA_CLONE_ID_KEY]
  const objs = useObjectMapByElementId[srcId]
  if (objs) {
    return {
      ...node,
      children: [
        ...children,
        ...objs.map((o) => {
          return {
            id: `clone_${o.id}`,
            tag: 'use',
            attributes: {
              href: `#${srcId}`,
              ...getGraphResolvedAttributes(o, attributesMap[srcId]),
            },
            children: [],
          }
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
    const attributes = { ...node.attributes }
    delete attributes.transform
    delete attributes.fill
    delete attributes.stroke
    // insert a template node to be cloned
    return {
      id: `blendic_group_${node.id}`,
      tag: 'g',
      attributes: { [DATA_CLONE_ID_KEY]: node.id },
      children: [
        {
          id: '',
          tag: 'template',
          attributes: {},
          children: [
            {
              id: node.id,
              tag: node.tag,
              attributes,
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
