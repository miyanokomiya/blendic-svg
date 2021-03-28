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

import { add, getPointOnBezier3, IVec2 } from 'okageo'
import {
  CurveBase,
  CurveBezier3,
  KeyframeBase,
  KeyframePoint,
} from '/@/models/keyframe'
import { applyScale } from '/@/utils/geometry'

type NeighborKeyframe<T extends KeyframeBase> =
  | []
  | [same: T]
  | [start: T, end: T]

interface KeyframePointWithFrame {
  keyframePoint: KeyframePoint
  frame: number
}

export function getNeighborKeyframes<T extends KeyframeBase>(
  sortedKeyframes: T[],
  frame: number
): NeighborKeyframe<T> {
  if (sortedKeyframes.length === 0) return []

  const afterIndex = sortedKeyframes.findIndex((k) => frame <= k.frame)
  if (afterIndex === -1) {
    return [sortedKeyframes[sortedKeyframes.length - 1]]
  }

  const after = sortedKeyframes[afterIndex]
  if (after.frame === frame || afterIndex === 0) {
    return [after]
  }

  const before = sortedKeyframes[afterIndex - 1]
  if (before.frame === frame) {
    return [before]
  }

  return [before, after]
}

export function interpolateKeyframePoint(
  start: KeyframePointWithFrame,
  end: KeyframePointWithFrame,
  frame: number
): number {
  const s = toPoint(start)
  const e = toPoint(end)
  const curveFn = getCurveFn(s, e, start.keyframePoint.curve)
  return curveFn(frame)
}

function toPoint(keyframePointWithFrame: KeyframePointWithFrame): IVec2 {
  return {
    x: keyframePointWithFrame.frame,
    y: keyframePointWithFrame.keyframePoint.value,
  }
}

type CurveFn = (x: number) => number

export function getCurveFn(
  start: IVec2,
  end: IVec2,
  curve: CurveBase
): CurveFn {
  switch (curve.name) {
    case 'constant':
      return getConstantCurveFn(start)
    case 'linear':
      return getLinearCurveFn(start, end)
    case 'bezier3':
      return getBezier3CurveFn(
        start,
        (curve as CurveBezier3).c1,
        (curve as CurveBezier3).c2,
        end
      )
  }
}

function getConstantCurveFn(start: IVec2): CurveFn {
  return () => start.y
}

function getLinearCurveFn(start: IVec2, end: IVec2): CurveFn {
  const rangeX = end.x - start.x
  if (rangeX === 0) return (x) => x
  return (x) => ((x - start.x) / rangeX) * (end.y - start.y) + start.y
}

function getBezier3CurveFn(
  start: IVec2,
  c1: IVec2,
  c2: IVec2,
  end: IVec2
): CurveFn {
  const rangeX = end.x - start.x
  if (rangeX === 0) return (x) => x

  return (x) => {
    return getPointOnBezier3(
      getNormalizedBezier3Points(start, c1, c2, end),
      (x - start.x) / rangeX
    ).y
  }
}

export function getNormalizedBezier3Points(
  start: IVec2,
  c1: IVec2,
  c2: IVec2,
  end: IVec2
): [IVec2, IVec2, IVec2, IVec2] {
  const rangeX = end.x - start.x
  const rangeY = end.y - start.y
  const v = { x: rangeX, y: rangeY }
  const c1t = add(applyScale(v, c1), start)
  const c2t = add(applyScale(v, c2), start)
  return [start, c1t, c2t, end]
}

export function isSameKeyframePoint(
  a: KeyframePoint,
  b: KeyframePoint
): boolean {
  return a.value === b.value
}

export function interpolateKeyframeProp(
  keyframes: KeyframeBase[],
  frame: number,
  getPropFn: (k: KeyframeBase) => KeyframePoint | undefined
): number | undefined {
  const filtered = keyframes.filter((k) => getPropFn(k))
  const neighbors = getNeighborKeyframes(filtered, frame)

  if (neighbors.length === 0) {
    return
  } else if (neighbors.length === 1) {
    return getPropFn(neighbors[0])!.value
  } else {
    return interpolateKeyframePoint(
      {
        frame: neighbors[0].frame,
        keyframePoint: getPropFn(neighbors[0])!,
      },
      {
        frame: neighbors[1].frame,
        keyframePoint: getPropFn(neighbors[1])!,
      },
      frame
    )
  }
}
