import { IVec2 } from 'okageo'
import { v4 } from 'uuid'
import { ComputedRef } from 'vue'
import { toKeyMap } from '../utils/commons'

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
  keyframes: Keyframe[]
}

export interface Keyframe {
  id: string
  frame: number
  transform: Transform
  bornId: string
}

export interface Born {
  id: string
  name: string
  transform: Transform
  parentId: string
  connected: boolean
  head: IVec2
  tail: IVec2
}

export interface Armature {
  id: string
  name: string
  transform: Transform
  borns: Born[]
}

export interface Actor {
  parent: Armature
  svgElements: SvgElement[]
}

export interface SvgElement {
  id: string
  transform: Transform
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
  return {
    id: generateId ? v4() : '',
    name: '',
    totalFrame: 60,
    armatureId: '',
    keyframes: [],
    ...arg,
  }
}

export function getKeyframe(
  arg: Partial<Keyframe> = {},
  generateId = false
): Keyframe {
  return {
    id: generateId ? v4() : '',
    frame: 0,
    bornId: '',
    transform: getTransform(),
    ...arg,
  }
}

export function getBorn(arg: Partial<Born> = {}, generateId = false): Born {
  return {
    id: generateId ? v4() : '',
    name: '',
    transform: getTransform(),
    parentId: '',
    connected: false,
    head: { x: 0, y: 0 },
    tail: { x: 0, y: 0 },
    ...arg,
  }
}

export function getArmature(
  arg: Partial<Armature> = {},
  generateId = false
): Armature {
  return {
    id: generateId ? v4() : '',
    name: '',
    transform: getTransform(),
    borns: [],
    ...arg,
  }
}

export interface BornSelectedState {
  head?: boolean
  tail?: boolean
}
export type CanvasMode = 'object' | 'edit' | 'pose'
export type CanvasCommand = '' | 'grab' | 'rotate' | 'scale'
export type EditMode = '' | 'grab' | 'rotate' | 'scale' | 'extrude'

export type EditMovement = { current: IVec2; start: IVec2 }

export interface CanvasEditModeBase {
  command: ComputedRef<EditMode>
  getEditTransforms: (id: string) => Transform
  end: () => void
  cancel: () => void
  setEditMode: (mode: EditMode) => void
  select: (id: string, selectedState: BornSelectedState) => void
  shiftSelect: (id: string, selectedState: BornSelectedState) => void
  selectAll: () => void
  mousemove: (arg: EditMovement) => void
  clickAny: () => void
  clickEmpty: () => void
  execDelete: () => void
  execAdd: () => void
}

export function editModeToCanvasCommand(editMode: EditMode): CanvasCommand {
  if (editMode === 'grab') return 'grab'
  if (editMode === 'extrude') return 'grab'
  if (editMode === 'rotate') return 'rotate'
  if (editMode === 'scale') return 'scale'
  return ''
}

export function toMap<T extends { id: string }>(list: T[]): IdMap<T> {
  return toKeyMap(list, 'id')
}
export function toBornIdMap<T extends { bornId: string }>(list: T[]): IdMap<T> {
  return toKeyMap(list, 'bornId')
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

export function isSameBornSelectedState(
  a?: BornSelectedState,
  b?: BornSelectedState
): boolean {
  return !!a?.head === !!b?.head && !!a?.tail === !!b?.tail
}

export function isBornSelected(selectedState?: BornSelectedState): boolean {
  if (!selectedState) return false
  if (selectedState.head) return true
  if (selectedState.tail) return true
  return false
}
