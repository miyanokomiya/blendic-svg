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
} from '../models'
import { boneToAffine, getTransformedBoneMap } from './armatures'
import { mapReduce } from './commons'
import { getTnansformStr } from './helpers'
import { KeyframeBase } from '/@/models/keyframe'
import { getPosedAttributesWithoutTransform } from '/@/utils/attributesResolver'
import { flatElementTree } from '/@/utils/elements'
import { isIdentityAffine } from '/@/utils/geometry'
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
      if (typeof c === 'string') return p
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
      if (typeof c === 'string') return c
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

  const interpolatedOptionMap = keyframeConstraint.getInterpolatedOptionMapByTargetId(
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