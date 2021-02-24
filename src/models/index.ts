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
  boneId: string
}

export interface Bone {
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
  bones: Bone[]
}

export interface ElementNode {
  id: string
  tag: string
  attributs: { [name: string]: string }
  children: (ElementNode | string)[]
}

export interface BElement {
  id: string
  boneId: string
}

export interface Actor {
  id: string
  armatureId: string
  svgTree: ElementNode
  elements: BElement[]
  viewBox: IRectangle
}

export function getElementNode(
  arg: Partial<ElementNode> = {},
  generateId = false
): ElementNode {
  const id = generateId ? v4() : arg.id ?? ''
  return {
    tag: '',
    attributs: {},
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
    boneId: '',
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
    viewBox: { x: 0, y: 0, width: 100, height: 100 },
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
    boneId: '',
    transform: getTransform(),
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

export interface BoneSelectedState {
  head?: boolean
  tail?: boolean
}
export type CanvasMode = 'object' | 'edit' | 'pose' | 'weight'
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
  select: (id: string, selectedState: BoneSelectedState) => void
  shiftSelect: (id: string, selectedState: BoneSelectedState) => void
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
export function toBoneIdMap<T extends { boneId: string }>(list: T[]): IdMap<T> {
  return toKeyMap(list, 'boneId')
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
