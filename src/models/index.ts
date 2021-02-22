import { IRectangle, IVec2 } from 'okageo'
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
  id: string
  armatureId: string
  svgElements: SvgElement[]
  svgAttributes: { [name: string]: string }[]
  svgInnerHtml: string
  viewBox: IRectangle
}

export interface SvgElement {
  id: string
  transform: Transform
  parentId: string
}

export function getActor(arg: Partial<Actor> = {}, generateId = false): Actor {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    armatureId: '',
    svgElements: [],
    svgAttributes: [],
    svgInnerHtml: '',
    viewBox: { x: 0, y: 0, width: 100, height: 100 },
    ...arg,
    id,
  }
}

export function getSvgElement(
  arg: Partial<SvgElement> = {},
  generateId = false
): SvgElement {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    parentId: '',
    transform: getTransform(),
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

export function getKeyframe(
  arg: Partial<Keyframe> = {},
  generateId = false
): Keyframe {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    frame: 0,
    bornId: '',
    transform: getTransform(),
    ...arg,
    id,
  }
}

export function getBorn(arg: Partial<Born> = {}, generateId = false): Born {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    name: '',
    transform: getTransform(),
    parentId: '',
    connected: false,
    head: { x: 0, y: 0 },
    tail: { x: 0, y: 0 },
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
    borns: [],
    ...arg,
    id,
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

export type CommandExam = { command: string; title: string }

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
  clip: () => void
  paste: () => void
  duplicate: () => void
  availableCommandList: ComputedRef<CommandExam[]>
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

export function isBornSelected(
  selectedState?: BornSelectedState,
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
