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

import { getRadian, IRectangle, isSame, IVec2 } from 'okageo'
import { Bone, scaleRate, Transform } from '/@/models'

// normalize in (-pi <= r <= pi)
export function normalizeRad(rad: number): number {
  if (rad < -Math.PI) return rad + Math.PI * 2
  else if (Math.PI < rad) return rad - Math.PI * 2
  else return rad
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
