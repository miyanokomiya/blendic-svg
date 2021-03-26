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

export type KeyframeName = 'bone'

export interface KeyframeBase {
  id: string
  frame: number
  name: KeyframeName
  points: {
    [key: string]: KeyframePoint
  }
}

export interface KeyframeBaseProps<T> {
  name: KeyframeName
  props: {
    [key: string]: T
  }
}

export type KeyframeBonePropKey =
  | 'translateX'
  | 'translateY'
  | 'rotate'
  | 'scaleX'
  | 'scaleY'

export interface KeyframeBone extends KeyframeBase {
  boneId: string
  points: {
    [key in KeyframeBonePropKey]?: KeyframePoint
  }
}

export interface KeyframeBoneProps<T> extends KeyframeBaseProps<T> {
  name: 'bone'
  props: {
    [key in KeyframeBonePropKey]?: T
  }
}

export interface KeyframeBaseSameRange extends KeyframeBaseProps<number> {}

export interface KeyframeBoneSameRange extends KeyframeBaseSameRange {
  props: {
    [key in KeyframeBonePropKey]?: number
  }
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

export interface KeyframeSelectedState extends KeyframeBaseProps<boolean> {}

export function getKeyframeBone(
  arg: Partial<KeyframeBone> = {},
  generateId = false
): KeyframeBone {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    frame: 0,
    boneId: '',
    name: 'bone',
    points: {},
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
