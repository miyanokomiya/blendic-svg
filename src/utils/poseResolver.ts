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
import { BElement, Bone, ElementNode, IdMap, toMap, Transform } from '../models'
import { getTransformedBoneMap, poseToAffine } from './armatures'
import { getParentIdPath } from './commons'
import { getTnansformStr } from './helpers'

export type TransformCache = {
  [relativeRootBoneId: string]: { [boneId: string]: Transform }
}

export function resolveRelativePose(
  boneMap: IdMap<Bone>,
  relativeRootBoneId: string,
  boneId: string,
  cacheEffect?: TransformCache
): Transform | undefined {
  if (!boneId || !boneMap[boneId]) return

  if (cacheEffect?.[relativeRootBoneId]?.[boneId]) {
    return cacheEffect[relativeRootBoneId][boneId]
  }

  // get relative bone's transformation from relativeRootBoneId's tail
  const parentIdPath = getParentIdPath(boneMap, boneId, relativeRootBoneId)
  const posedMap = getTransformedBoneMap(
    toMap([...parentIdPath, boneId].map((id) => boneMap[id]))
  )
  const ret = {
    ...posedMap[boneId].transform,
    origin: posedMap[boneId].head,
  }

  if (cacheEffect) {
    if (cacheEffect[relativeRootBoneId]) {
      cacheEffect[relativeRootBoneId][boneId] = ret
    } else {
      cacheEffect[relativeRootBoneId] = { [boneId]: ret }
    }
  }

  return ret
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
    boneMap,
    elementMap,
    svgTree,
    undefined,
    undefined,
    {}
  )
}

function getPosedElementNode(
  boneMap: IdMap<Bone>,
  elementMap: IdMap<BElement>,
  node: ElementNode,
  relativeRootBoneId = '',
  spaceNativeMatrix = IDENTITY_AFFINE,
  transformCache?: TransformCache
): ElementNode {
  const bElement = elementMap[node.id]
  const spacePoseMatrix = getSpacePoseMatrix(
    boneMap,
    relativeRootBoneId,
    transformCache
  )
  const boundBoneId = bElement?.boneId || relativeRootBoneId
  const selfPoseMatrix = getSelfPoseMatrix(boneMap, boundBoneId, transformCache)
  const nativeMatrix = getnativeMatrix(node, spaceNativeMatrix)
  const transformStr = affineToTransform(
    multiAffines(
      [
        getPoseDeformMatrix(spacePoseMatrix, selfPoseMatrix, spaceNativeMatrix),
        nativeMatrix,
      ].filter((m): m is AffineMatrix => !!m)
    )
  )

  return {
    id: node.id,
    tag: node.tag,
    attributs: {
      ...node.attributs,
      transform: transformStr,
    },
    children: node.children.map((c) => {
      if (typeof c === 'string') return c
      return getPosedElementNode(
        boneMap,
        elementMap,
        c,
        boundBoneId,
        nativeMatrix,
        transformCache
      )
    }),
  }
}

function getSpacePoseMatrix(
  boneMap: IdMap<Bone>,
  relativeRootBoneId: string,
  transformCache?: TransformCache
) {
  const t = resolveRelativePose(boneMap, '', relativeRootBoneId, transformCache)
  return t ? poseToAffine(t) : undefined
}

function getSelfPoseMatrix(
  boneMap: IdMap<Bone>,
  boundBoneId: string,
  transformCache?: TransformCache
) {
  const t = resolveRelativePose(boneMap, '', boundBoneId, transformCache)
  return t ? poseToAffine(t) : undefined
}

function getnativeMatrix(node: ElementNode, spaceNativeMatrix: AffineMatrix) {
  return getNativeDeformMatrix(
    spaceNativeMatrix,
    node.attributs.transform
      ? parseTransform(node.attributs.transform)
      : undefined
  )
}
