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

import { v4 } from 'uuid'
import { IVec2 } from 'okageo'
import { Transform } from '/@/models'

export interface KeyframeBase {
  id: string
  frame: number
}

export interface KeyframeBone extends KeyframeBase {
  boneId: string
  translateX?: KeyframePoint
  translateY?: KeyframePoint
  rotate?: KeyframePoint
  scaleX?: KeyframePoint
  scaleY?: KeyframePoint
}

export type CurveName = 'linear' | 'bezier3'

export interface KeyframePoint {
  value: number
  curve: CurveLinear | CurveBezier3
}

export interface CurveBase {
  name: CurveName
}

export interface CurveLinear extends CurveBase {
  name: 'linear'
}

export interface CurveBezier3 extends CurveBase {
  name: 'bezier3'
  c1: IVec2
  c2: IVec2
}

export function getKeyframeBone(
  arg: Partial<KeyframeBone> = {},
  generateId = false
): KeyframeBone {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    frame: 0,
    boneId: '',
    ...arg,
    id,
  }
}

export function getKeyframePoint(
  arg: Partial<KeyframePoint> = {}
): KeyframePoint {
  return {
    value: 0,
    curve: { name: 'linear' },
    ...arg,
  }
}
