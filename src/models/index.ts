import { IVec2 } from 'okageo'
import { v4 } from 'uuid'

export interface Transform {
  translate: IVec2
  origin: IVec2
  rotate: number // degree
  scale: IVec2
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
export type EditMode = '' | 'grab' | 'rotate' | 'scale' | 'extrude'

export function toMap<T extends { id: string }>(
  list: T[]
): { [id: string]: T } {
  return list.reduce<{ [id: string]: T }>(
    (m, item) => ({
      ...m,
      [item.id]: item,
    }),
    {}
  )
}
