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

import { isSame, IVec2 } from 'okageo'
import { scaleRate, Transform } from '/@/models'

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
  return Math.round(rotate / angle) * angle
}
