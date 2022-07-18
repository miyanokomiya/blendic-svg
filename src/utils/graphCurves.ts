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

import { add, IVec2 } from 'okageo'
import { IdMap } from '/@/models'
import {
  CurveName,
  CurveSelectedState,
  KeyframeBase,
  KeyframeName,
  KeyframePoint,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import { frameToCanvas, canvasToFrame } from '/@/utils/animations'
import { mapReduce } from '/@/utils/commons'
import { symmetrizeRotate } from '/@/utils/geometry'
import {
  getMonotonicBezier3Points,
  getNormalizedBezier3Points,
} from '/@/utils/keyframes/core'

export type CurveInfo = {
  id: string
  keyframeName: KeyframeName
  name: CurveName
  selected: boolean
  first: boolean
  last: boolean
  from: IVec2
  to?: IVec2
  c1?: IVec2
  c2?: IVec2
  fixedC1?: IVec2
  fixedC2?: IVec2
  controlIn?: IVec2
  controlOut?: IVec2
}

export function toPoint(
  p: KeyframePoint,
  frame: number,
  valueWidth: number
): IVec2 {
  return {
    x: frameToCanvas(frame),
    y: p.value * valueWidth,
  }
}

export function controlToPoint(c: IVec2, valueWidth: number): IVec2 {
  return {
    x: frameToCanvas(c.x),
    y: c.y * valueWidth,
  }
}

export function pointToControl(c: IVec2, valueWidth: number): IVec2 {
  return {
    x: canvasToFrame(c.x),
    y: c.y / valueWidth,
  }
}

function createCurveInfo(
  index: number,
  point: KeyframePoint,
  base: CurveInfo,
  keyframes: KeyframeBase[],
  pointKey: string,
  valueWidth: number
): CurveInfo {
  if (index === keyframes.length - 1) {
    return { ...base }
  }

  const next = keyframes[index + 1]
  const to = toPoint(next.points[pointKey], next.frame, valueWidth)

  if (point.curve.name !== 'bezier3') {
    return { ...base, to }
  }

  const c1Base = controlToPoint(point.curve.controlOut, valueWidth)
  const c2Base = controlToPoint(
    next.points[pointKey].curve.controlIn,
    valueWidth
  )
  const [, c1, c2] = getNormalizedBezier3Points(base.from, c1Base, c2Base, to)
  const [, fixedC1, fixedC2] = getMonotonicBezier3Points(
    base.from,
    c1Base,
    c2Base,
    to
  )

  return {
    ...base,
    to,
    c1,
    c2,
    fixedC1,
    fixedC2,
    controlOut: c1,
  }
}

export function getCurves(args: {
  keyframes: KeyframeBase[]
  selectedStateMap: IdMap<KeyframeSelectedState>
  pointKey: string
  valueWidth: number
}): IdMap<CurveInfo> {
  const length = args.keyframes.length
  const idMap: { [id: string]: boolean } = {}
  let before: CurveInfo | undefined = undefined

  return args.keyframes.reduce<IdMap<CurveInfo>>((ret, k, i) => {
    const selectedState = args.selectedStateMap[k.id]
    const p = k.points[args.pointKey]
    const from = toPoint(p, k.frame, args.valueWidth)

    const controlIn =
      before?.name === 'bezier3'
        ? add(controlToPoint(p.curve.controlIn, args.valueWidth), from)
        : undefined

    idMap[k.id] = true

    const curve = createCurveInfo(
      i,
      p,
      {
        id: k.id,
        keyframeName: k.name,
        name: p.curve.name,
        selected: selectedState?.props[args.pointKey] ?? false,
        first: i === 0,
        last: i === length - 1,
        from,
        controlIn,
      },
      args.keyframes,
      args.pointKey,
      args.valueWidth
    )

    before = curve
    ret[curve.id] = curve

    return ret
  }, {})
}

export function moveCurveControlsMap(
  keyframeMap: IdMap<KeyframeBase>,
  targetMap: IdMap<IdMap<CurveSelectedState>>,
  diff: IVec2,
  symmetrize = false
): IdMap<KeyframeBase> {
  return Object.keys(targetMap).reduce<IdMap<KeyframeBase>>((p, keyframeId) => {
    if (keyframeMap[keyframeId]) {
      p[keyframeId] = moveCurveControls(
        keyframeMap[keyframeId],
        targetMap[keyframeId],
        diff,
        symmetrize
      )
    }
    return p
  }, {})
}

export function moveCurveControls(
  keyframe: KeyframeBase,
  targets: IdMap<CurveSelectedState>,
  diff: IVec2,
  symmetrize = false
): KeyframeBase {
  return {
    ...keyframe,
    points: mapReduce(keyframe.points, (p, key) => {
      const selectedState = targets[key]
      if (!selectedState) return p

      if (selectedState.controlIn) {
        const nextIn = {
          x: Math.min(p.curve.controlIn.x + diff.x, 0),
          y: p.curve.controlIn.y + diff.y,
        }
        const nextOut = symmetrize
          ? symmetrizeRotate({ x: 0, y: 0 }, nextIn, p.curve.controlOut)
          : p.curve.controlOut

        return {
          value: p.value,
          curve: {
            name: p.curve.name,
            controlIn: nextIn,
            controlOut: nextOut,
          },
        }
      } else {
        const nextOut = {
          x: Math.max(p.curve.controlOut.x + diff.x, 0),
          y: p.curve.controlOut.y + diff.y,
        }

        const nextIn = symmetrize
          ? symmetrizeRotate({ x: 0, y: 0 }, nextOut, p.curve.controlIn)
          : p.curve.controlIn

        return {
          value: p.value,
          curve: {
            name: p.curve.name,
            controlIn: nextIn,
            controlOut: nextOut,
          },
        }
      }
    }),
  }
}
