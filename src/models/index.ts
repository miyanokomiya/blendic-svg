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

import { IRectangle, IVec2 } from 'okageo'
import { v4 } from 'uuid'
import { toKeyMap } from '../utils/commons'
import { BoneConstraint } from '../utils/constraints'
import { GraphNode } from '/@/models/graphNode'
import { KeyframeBase } from '/@/models/keyframe'

export type IdMap<T> = {
  [id: string]: T
}

export interface Transform {
  translate: IVec2
  origin: IVec2
  rotate: number // degree
  scale: IVec2
}

export interface Action {
  id: string
  name: string
  totalFrame: number
  armatureId: string
  keyframes: KeyframeBase[]
}

export interface Bone {
  id: string
  name: string
  transform: Transform
  parentId: string
  connected: boolean
  head: IVec2
  tail: IVec2
  inheritRotation: boolean
  inheritScale: boolean
  constraints: BoneConstraint[]
}

export interface Armature {
  id: string
  name: string
  transform: Transform
  bones: string[]
}

export interface ElementNodeAttributes {
  [name: string]: string
}

export interface ElementNode {
  id: string
  tag: string
  attributes: ElementNodeAttributes
  children: (ElementNode | string)[]
}

export interface BElement {
  id: string
  tag: string
  index: number
  parentId?: string
  boneId?: string
  viewBoxBoneId?: string
  fillBoneId?: string
  strokeBoneId?: string
}

export interface Actor {
  id: string
  armatureId: string
  svgTree: ElementNode
  elements: BElement[]
  viewBox: IRectangle
}

export interface AnimationGraph {
  id: string
  name: string
  armatureId: string
  nodes: GraphNode[]
}

export function getAnimationGraph(
  arg: Partial<AnimationGraph> = {},
  generateId = false
): AnimationGraph {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    name: '',
    armatureId: '',
    nodes: [],
    ...arg,
    id,
  }
}

export interface GraphObject {
  id: string

  elementId?: string
  tag?: string
  parent?: string
  index: number

  transform?: Transform
  fill?: Transform | string
  stroke?: Transform | string
  'stroke-width'?: number
  attributes?: GraphObjectAttributes

  text?: string

  clone?: boolean
  create?: boolean
}

export interface GraphObjectAttributes {
  x?: number
  y?: number
  dx?: number
  dy?: number
  width?: number
  height?: number
  viewBox?: IRectangle
  cx?: number
  cy?: number
  r?: number
  rx?: number
  ry?: number
  fx?: number
  fy?: number
  d?: string[]
  'font-size'?: number
  'text-anchor'?: string
  'dominant-baseline'?: string
  'stroke-dasharray'?: string
  'stroke-dashoffset'?: number

  x1?: number
  y1?: number
  x2?: number
  y2?: number
  offset?: number
  'stop-color'?: Transform
  gradientUnits?: 'objectBoundingBox' | 'userSpaceOnUse'
  spreadMethod?: 'pad' | 'reflect' | 'repeat'
}

export function getGraphObject(
  arg: Partial<GraphObject> = {},
  generateId = false
): GraphObject {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    index: 0,
    ...arg,
    id,
  }
}

export type SpaceType = 'world' | 'local'

export function getElementNode(
  arg: Partial<ElementNode> = {},
  generateId = false
): ElementNode {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    tag: '',
    attributes: {},
    children: [],
    ...arg,
    id,
  }
}

export function getBElement(
  arg: Partial<BElement> = {},
  generateId = false
): BElement {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    index: 0,
    tag: '',
    ...arg,
    id,
  }
}

export function getActor(arg: Partial<Actor> = {}, generateId = false): Actor {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    armatureId: '',
    svgTree: getElementNode(),
    elements: [],
    viewBox: { x: 0, y: 0, width: 400, height: 400 },
    ...arg,
    id,
  }
}

export function getTransform(arg: Partial<Transform> = {}): Transform {
  return {
    translate: { x: 0, y: 0 },
    origin: { x: 0, y: 0 },
    rotate: 0,
    scale: { x: 1, y: 1 },
    ...arg,
  }
}

export function getAction(
  arg: Partial<Action> = {},
  generateId = false
): Action {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    name: '',
    totalFrame: 60,
    armatureId: '',
    keyframes: [],
    ...arg,
    id,
  }
}

export function getBone(arg: Partial<Bone> = {}, generateId = false): Bone {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    name: '',
    transform: getTransform(),
    parentId: '',
    connected: false,
    head: { x: 0, y: 0 },
    tail: { x: 0, y: 0 },
    inheritRotation: true,
    inheritScale: true,
    constraints: [],
    ...arg,
    id,
  }
}

export function getArmature(
  arg: Partial<Armature> = {},
  generateId = false
): Armature {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    name: '',
    transform: getTransform(),
    bones: [],
    ...arg,
    id,
  }
}

export type BoneSelectedState = Partial<{
  head: true
  tail: true
}>

export function toMap<T extends { id: string }>(list: T[]): IdMap<T> {
  return toKeyMap(list, 'id')
}
export function toBoneIdMap<T extends { boneId: string }>(list: T[]): IdMap<T> {
  return toKeyMap(list, 'boneId')
}
export function toTargetIdMap<T extends { targetId: string }>(
  list: T[]
): IdMap<T> {
  return toKeyMap(list, 'targetId')
}
export function toFrameMap<T extends { frame: number }>(list: T[]): IdMap<T> {
  return toKeyMap(list, 'frame')
}

export function mergeMap<T>(src: IdMap<T>, override: IdMap<T>): IdMap<T> {
  return Object.keys({ ...src, ...override }).reduce<IdMap<T>>((p, c) => {
    p[c] = { ...(src[c] ?? {}), ...(override[c] ?? {}) } as T
    return p
  }, {})
}

export function getOriginPartial<T>(src: T, partial: Partial<T>): Partial<T> {
  return Object.keys(partial).reduce<Partial<T>>((p, c) => {
    // @ts-ignore
    p[c] = src[c]
    return p
  }, {})
}

export function isSameBoneSelectedState(
  a?: BoneSelectedState,
  b?: BoneSelectedState
): boolean {
  return !!a?.head === !!b?.head && !!a?.tail === !!b?.tail
}

export function isBoneSelected(
  selectedState?: BoneSelectedState,
  all = false
): boolean {
  if (!selectedState) return false

  return all
    ? !!selectedState.head && !!selectedState.tail
    : !!selectedState.head || !!selectedState.tail
}

export const scaleRate = 1.1
export const frameWidth = 10

export type PlayState = 'pause' | 'play' | 'reverse'
