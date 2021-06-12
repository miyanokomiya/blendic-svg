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

export type KeyframeName = 'bone' | 'constraint'

export interface KeyframeBase {
  id: string
  frame: number
  name: KeyframeName
  targetId: string
  points: {
    [key: string]: KeyframePoint
  }
}

export interface KeyframeBaseProps<T> {
  props: {
    [key: string]: T
  }
}

export type KeyframePropKey = KeyframeBonePropKey | KeyframeConstraintPropKey

export type KeyframeBonePropKey =
  | 'translateX'
  | 'translateY'
  | 'rotate'
  | 'scaleX'
  | 'scaleY'

export interface KeyframeBone extends KeyframeBase {
  name: 'bone'
  points: {
    [key in KeyframeBonePropKey]?: KeyframePoint
  }
}

export type KeyframeConstraintPropKey = 'influence'

export interface KeyframeConstraint extends KeyframeBase {
  name: 'constraint'
  points: {
    [key in KeyframeConstraintPropKey]?: KeyframePoint
  }
}

export interface KeyframeBaseSameRange extends KeyframeBaseProps<number> {}

export interface KeyframeBoneSameRange extends KeyframeBaseSameRange {
  props: {
    [key in KeyframeBonePropKey]?: number
  }
}

export type KeyframeStatus = 'none' | 'others' | 'self'

export interface KeyframePropsStatus
  extends KeyframeBaseProps<KeyframeStatus> {}

export type CurveName = 'constant' | 'linear' | 'bezier3'

export interface KeyframePoint {
  value: number
  curve: CurveBase
}

export interface CurveBase {
  name: CurveName
  // relative from parent point
  controlIn: IVec2
  controlOut: IVec2
}

export interface CurveSelectedState {
  controlIn?: boolean
  controlOut?: boolean
}

export interface KeyframeSelectedState extends KeyframeBaseProps<boolean> {}

export function getKeyframeBone(
  arg: Partial<KeyframeBone> = {},
  generateId = false
): KeyframeBone {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    frame: 0,
    targetId: '',
    name: 'bone',
    points: {},
    ...arg,
    id,
  }
}

export function isKeyframeBone(src: KeyframeBase): src is KeyframeBone {
  return src.name === 'bone'
}

export function getKeyframeConstraint(
  arg: Partial<KeyframeConstraint> = {},
  generateId = false
): KeyframeConstraint {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    frame: 0,
    targetId: '',
    name: 'constraint',
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
    curve: getCurve('linear'),
    ...arg,
  }
}

export function getCurve(name: CurveName): CurveBase {
  return getCurveBase(name)
}

function getCurveBase(name: CurveName): CurveBase {
  return {
    name: name,
    // x: frame, y: value
    controlIn: { x: -10, y: 0 },
    controlOut: { x: 10, y: 0 },
  }
}
