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
  add,
  AffineMatrix,
  getPedal,
  getRadian,
  IDENTITY_AFFINE,
  IRectangle,
  isSame,
  IVec2,
  multi,
  multiAffines,
  rotate,
  sub,
} from 'okageo'
import { Bone, getTransform, scaleRate, Transform } from '/@/models'

export function clamp(min = -Infinity, max = Infinity, val: number) {
  return Math.max(Math.min(val, max), min)
}

export function circleClamp(min: number, max: number, val: number) {
  if (min === max) return min

  if (max < val) {
    return ((val - max) % (max - min)) + min
  } else if (val < min) {
    return max - ((min - val) % (max - min))
  } else {
    return val
  }
}

export function logRound(log: number, val: number) {
  const pow = Math.pow(10, -log)
  return Math.round(val * pow) / pow
}

// normalize in (-pi <= r <= pi)
export function normalizeRad(rad: number): number {
  return circleClamp(-Math.PI, Math.PI, rad)
}

function getContinuousRad(
  normalizedCurrentRad: number,
  normalizedNextRad: number
): number {
  if (
    normalizedCurrentRad > 0 &&
    normalizedNextRad < normalizedCurrentRad - Math.PI
  ) {
    return normalizedNextRad + Math.PI * 2
  } else if (
    normalizedCurrentRad < 0 &&
    normalizedNextRad > normalizedCurrentRad + Math.PI
  ) {
    return normalizedNextRad - Math.PI * 2
  } else {
    return normalizedNextRad
  }
}

export function getContinuousRadDiff(
  currentRad: number,
  nextRad: number
): number {
  const normalizedCurrentRad = normalizeRad(currentRad)
  const normalizedNextRad = normalizeRad(nextRad)
  return (
    getContinuousRad(normalizedCurrentRad, normalizedNextRad) -
    normalizedCurrentRad
  )
}

export function mapVec(
  v: IVec2,
  fn: (val: number) => number,
  fnY?: (val: number) => number
): IVec2 {
  return {
    x: fn(v.x),
    y: (fnY ?? fn)(v.y),
  }
}

const _identityTransform = getTransform()
export function isIdentityTransform(a: Transform): boolean {
  return isSameTransform(a, _identityTransform)
}

export function isSameTransform(a: Transform, b: Transform): boolean {
  if (!isSame(a.translate, b.translate)) return false
  if (!isSame(a.scale, b.scale)) return false
  if (!isSame(a.origin, b.origin)) return false
  if (a.rotate !== b.rotate) return false
  return true
}

export function getGridSize(scale: number): number {
  const log = Math.round(Math.log(scale) / Math.log(scaleRate))
  if (log < 5) return 10
  if (log < 8) return 20
  else if (log < 11) return 50
  else return 100
}

export function snapGrid(scale: number, vec: IVec2): IVec2 {
  const gridSpan = getGridSize(scale)
  return {
    x: Math.round(vec.x / gridSpan) * gridSpan,
    y: Math.round(vec.y / gridSpan) * gridSpan,
  }
}

export function snapRotate(rotate: number, angle = 15): number {
  return snapNumber(rotate, angle)
}

export function snapScale(scale: IVec2, step = 0.1): IVec2 {
  return {
    x: snapNumber(scale.x, step),
    y: snapNumber(scale.y, step),
  }
}

export function snapNumber(value: number, step = 1): number {
  return Math.round(value / step) * step
}

export function getNormalRectangle(rect: IRectangle): IRectangle {
  const x = rect.width > 0 ? rect.x : rect.x + rect.width
  const y = rect.height > 0 ? rect.y : rect.y + rect.height
  return {
    x,
    y,
    width: Math.abs(rect.width),
    height: Math.abs(rect.height),
  }
}

export function getBoneBodyRotation(bone: Bone): number {
  return (getRadian(bone.tail, bone.head) / Math.PI) * 180
}

export function getBoneWorldRotation(bone: Bone): number {
  return bone.transform.rotate + getBoneBodyRotation(bone)
}

export function getBoneWorldLocation(bone: Bone): IVec2 {
  return add(bone.head, bone.transform.translate)
}

export function getBoneSquaredSize(bone: Bone): number {
  const dx = bone.head.x - bone.tail.x
  const dy = bone.head.y - bone.tail.y
  return dx * dx + dy * dy
}

export function applyScale(
  p: IVec2,
  scale: IVec2,
  origin: IVec2 = { x: 0, y: 0 }
): IVec2 {
  return {
    x: origin.x + (p.x - origin.x) * scale.x,
    y: origin.y + (p.y - origin.y) * scale.y,
  }
}

export function invertScaleOrZero(scale: IVec2): IVec2 {
  return {
    x: scale.x === 0 ? 0 : 1 / scale.x,
    y: scale.y === 0 ? 0 : 1 / scale.y,
  }
}

export function applyTransform(p: IVec2, transform: Transform): IVec2 {
  return add(
    rotate(
      applyScale(p, transform.scale, transform.origin),
      (transform.rotate / 180) * Math.PI,
      transform.origin
    ),
    transform.translate
  )
}

export function applyPosedTransformToPoint(parent: Bone, point: IVec2): IVec2 {
  const head = applyTransform(
    parent.head,
    getTransform({ translate: parent.transform.translate })
  )
  const tail = applyTransform(
    parent.tail,
    getTransform({
      ...parent.transform,
      origin: parent.head,
      scale: { x: 1, y: 1 },
    })
  )
  const rotatedAndTranslatedPoint = applyTransform(
    point,
    getTransform({
      ...parent.transform,
      origin: parent.head,
      scale: { x: 1, y: 1 },
    })
  )
  if (isSame(head, tail)) {
    return rotatedAndTranslatedPoint
  }

  const pedal = getPedal(rotatedAndTranslatedPoint, [head, tail])
  // scale y affects bone's height
  const vecY = sub(pedal, head)
  // scale x affects bone's width
  const vecX = sub(rotatedAndTranslatedPoint, pedal)

  return add(
    add(
      multi(vecY, parent.transform.scale.y),
      multi(vecX, parent.transform.scale.x)
    ),
    head
  )
}

export function applyTransformToVec(vec: IVec2, transform: Transform): IVec2 {
  return applyTransform(vec, {
    ...transform,
    translate: { x: 0, y: 0 },
  })
}

export function transformRect(
  rect: IRectangle,
  transform: Transform
): IRectangle {
  const origin = applyTransform(rect, { ...transform, rotate: 0 })
  return {
    ...origin,
    width: rect.width * transform.scale.x,
    height: rect.height * transform.scale.y,
  }
}

export function isIdentityAffine(matrix: AffineMatrix): boolean {
  return matrix.every((v, i) => v === IDENTITY_AFFINE[i])
}

export function transformToAffine(transform: Transform): AffineMatrix {
  const rad = (transform.rotate / 180) * Math.PI
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return multiAffines([
    [1, 0, 0, 1, transform.translate.x, transform.translate.y],
    [1, 0, 0, 1, transform.origin.x, transform.origin.y],
    [cos, sin, -sin, cos, 0, 0],
    [transform.scale.x, 0, 0, transform.scale.y, 0, 0],
    [1, 0, 0, 1, -transform.origin.x, -transform.origin.y],
  ])
}
