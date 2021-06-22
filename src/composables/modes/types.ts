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

import { ComputedRef } from '@vue/reactivity'
import { IRectangle, IVec2 } from 'okageo'
import { BoneSelectedState, Transform } from '/@/models'
import { CurveSelectedState, KeyframeSelectedState } from '/@/models/keyframe'
import { MouseOptions } from '/@/utils/devices'

export type CanvasMode = 'object' | 'edit' | 'pose' | 'weight'
export type CanvasCommand = '' | 'grab' | 'rotate' | 'scale'
export type EditMode =
  | ''
  | 'grab'
  | 'rotate'
  | 'scale'
  | 'extrude'
  | 'insert'
  | 'delete'

export type EditMovement = {
  current: IVec2
  start: IVec2
  ctrl: boolean
  scale: number
}

export interface PopupMenuItem {
  label: string
  exec?: () => void
  children?: PopupMenuItem[]
}

export interface ToolMenuGroup {
  label: string
  items: ToolMenuItem[]
}

export interface ToolMenuItem {
  label: string
  exec: () => void
  underline?: boolean
}

export type CommandExam = { command: string; title: string }

export type SelectOptions = Pick<MouseOptions, 'shift' | 'ctrl'>

export interface CanvasEditModeBase {
  command: ComputedRef<EditMode>
  getEditTransforms: (id: string) => Transform
  end: () => void
  cancel: () => void
  setEditMode: (mode: EditMode) => void
  select: (
    id: string,
    selectedState: BoneSelectedState,
    options?: SelectOptions
  ) => void
  rectSelect: (rect: IRectangle, options?: SelectOptions) => void
  selectAll: () => void
  mousemove: (arg: EditMovement) => void
  clickAny: () => void
  clickEmpty: () => void
  execDelete: () => void
  execAdd: () => void
  insert: () => void
  clip: () => void
  paste: () => void
  duplicate: () => boolean
  availableCommandList: ComputedRef<CommandExam[]>
  popupMenuList: ComputedRef<PopupMenuItem[]>
  toolMenuGroupList: ComputedRef<ToolMenuGroup[]>
}

export type KeyframeModeName = 'action'
export type KeyframeEditCommand =
  | ''
  | 'grab'
  | 'interpolation'
  | 'grab-control'
  | 'grab-current-frame'

export interface KeyframeEditModeBase {
  command: ComputedRef<KeyframeEditCommand>
  end: () => void
  cancel: () => void
  snap: (axis: 'x' | 'y') => void
  execKey: (arg: { key: string; shift?: boolean; ctrl?: boolean }) => {
    needLock: boolean
  }
  select: (id: string, selectedState: KeyframeSelectedState) => void
  shiftSelect: (id: string, selectedState: KeyframeSelectedState) => void
  selectAll: () => void
  mousemove: (arg: EditMovement) => void
  drag: (arg: EditMovement) => void
  clickAny: () => void
  clickEmpty: () => void
  upLeft: () => void
  execDelete: () => void
  availableCommandList: ComputedRef<CommandExam[]>
  popupMenuList: ComputedRef<PopupMenuItem[]>
  grabCurrentFrame: () => void
  grabControl: (
    keyframeId: string,
    pointKey: string,
    controls: CurveSelectedState
  ) => void
}
