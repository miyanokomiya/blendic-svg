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

export function getPoseDeformMatrix(
  relativePoseMatrix?: AffineMatrix,
  elementSpaceMatrix?: AffineMatrix
): AffineMatrix {
  return multiAffines(
    [
      elementSpaceMatrix ? invertTransform(elementSpaceMatrix) : undefined,
      relativePoseMatrix,
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
