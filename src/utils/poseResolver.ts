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

import { AffineMatrix, invertTransform, multiAffines } from 'okageo'
import { Bone, IdMap, toMap, Transform } from '../models'
import { getTransformedBoneMap } from './armatures'
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
