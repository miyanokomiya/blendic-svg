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
  Keyframe,
  BElement,
  Bone,
  ElementNode,
  IdMap,
  Transform,
} from '../models'
import { getInterpolatedTransformMapByBoneId } from './animations'
import { getTransformedBoneMap, poseToAffine } from './armatures'
import { mapReduce } from './commons'
import { getTnansformStr } from './helpers'
import { applyAllConstraints } from '/@/utils/constraints'

export type TransformCache = {
  [relativeRootBoneId: string]: { [boneId: string]: Transform }
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
) {
  return getPosedElementNode(
    getPosedElementMatrixMap(
      boneMap,
      elementMap,
      svgTree,
      undefined,
      undefined
    ),
    elementMap,
    svgTree
  )
}

export function getPosedElementMatrixMap(
  boneMap: IdMap<Bone>,
  elementMap: IdMap<BElement>,
  node: ElementNode,
  relativeRootBoneId = '',
  spaceNativeMatrix = IDENTITY_AFFINE
): IdMap<AffineMatrix> {
  const bElement = elementMap[node.id]
  const spacePoseMatrix =
    getSelfPoseMatrix(boneMap, relativeRootBoneId) ?? IDENTITY_AFFINE
  const boundBoneId = bElement?.boneId || relativeRootBoneId
  const selfPoseMatrix = getSelfPoseMatrix(boneMap, boundBoneId)
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
          boundBoneId,
          nativeMatrix
        ),
      }
      return p
    }, {}),
  }
}

function getPosedElementNode(
  matrixMap: IdMap<AffineMatrix>,
  elementMap: IdMap<BElement>,
  node: ElementNode
): ElementNode {
  const transformStr = matrixMap[node.id]
    ? affineToTransform(matrixMap[node.id])
    : ''

  return {
    id: node.id,
    tag: node.tag,
    attributs: {
      ...node.attributs,
      transform: transformStr,
    },
    children: node.children.map((c) => {
      if (typeof c === 'string') return c
      return getPosedElementNode(matrixMap, elementMap, c)
    }),
  }
}

function getSelfPoseMatrix(boneMap: IdMap<Bone>, boundBoneId: string) {
  const b = boneMap[boundBoneId]
  return b ? poseToAffine({ ...b.transform, origin: b.head }) : undefined
}

function getnativeMatrix(node: ElementNode, spaceNativeMatrix: AffineMatrix) {
  return getNativeDeformMatrix(
    spaceNativeMatrix,
    node.attributs.transform
      ? parseTransform(node.attributs.transform)
      : undefined
  )
}

export function bakeKeyframes(
  keyframeMapByBoneId: IdMap<Keyframe[]>,
  boneMap: IdMap<Bone>,
  elementMap: IdMap<BElement>,
  svgRoot: ElementNode,
  endFrame: number
): IdMap<AffineMatrix>[] {
  return [...Array(endFrame + 1)].map((_, i) => {
    return bakeKeyframe(keyframeMapByBoneId, boneMap, elementMap, svgRoot, i)
  })
}

export function bakeKeyframe(
  keyframeMapByBoneId: IdMap<Keyframe[]>,
  boneMap: IdMap<Bone>,
  elementMap: IdMap<BElement>,
  svgRoot: ElementNode,
  currentFrame: number
): IdMap<AffineMatrix> {
  const interpolatedBoneMap = mapReduce(
    getInterpolatedTransformMapByBoneId(keyframeMapByBoneId, currentFrame),
    (transform, id) => ({ ...boneMap[id], transform })
  )
  const resolvedBoneMap = applyAllConstraints(
    getTransformedBoneMap(interpolatedBoneMap)
  )

  return getPosedElementMatrixMap(resolvedBoneMap, elementMap, svgRoot)
}
