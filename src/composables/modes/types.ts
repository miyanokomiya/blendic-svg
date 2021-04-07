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
import { Transform } from '/@/models'
import { CurveSelectedState } from '/@/models/keyframe'

export type CanvasMode = 'object' | 'edit' | 'pose' | 'weight'
export type CanvasCommand = '' | 'grab' | 'rotate' | 'scale'
export type EditMode = '' | 'grab' | 'rotate' | 'scale' | 'extrude' | 'insert'

export type EditMovement = {
  current: IVec2
  start: IVec2
  ctrl: boolean
  scale: number
}

export interface PopupMenuItem {
  label: string
  exec: () => void
  focus?: boolean
}

export type CommandExam = { command: string; title: string }

export interface CanvasEditModeBase {
  command: ComputedRef<EditMode>
  getEditTransforms: (id: string) => Transform
  end: () => void
  cancel: () => void
  setEditMode: (mode: EditMode) => void
  select: (id: string, selectedState: { [key: string]: boolean }) => void
  shiftSelect: (id: string, selectedState: { [key: string]: boolean }) => void
  rectSelect: (rect: IRectangle, shift: boolean) => void
  selectAll: () => void
  mousemove: (arg: EditMovement) => void
  clickAny: () => void
  clickEmpty: () => void
  execDelete: () => void
  execAdd: () => void
  insert: () => void
  clip: () => void
  paste: () => void
  duplicate: () => void
  availableCommandList: ComputedRef<CommandExam[]>
  popupMenuList: ComputedRef<PopupMenuItem[]>
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
  setEditMode: (mode: KeyframeEditCommand) => void
  select: (id: string, selectedState: { [key: string]: boolean }) => void
  shiftSelect: (id: string, selectedState: { [key: string]: boolean }) => void
  selectAll: () => void
  mousemove: (arg: EditMovement) => void
  drag: (arg: EditMovement) => void
  clickAny: () => void
  clickEmpty: () => void
  upLeft: () => void
  execDelete: () => void
  clip: () => void
  paste: () => void
  duplicate: () => void
  availableCommandList: ComputedRef<CommandExam[]>
  popupMenuList: ComputedRef<PopupMenuItem[]>
  grabCurrentFrame: () => void
  grabControl: (
    keyframeId: string,
    pointKey: string,
    controls: CurveSelectedState
  ) => void
}

export function editModeToCanvasCommand(editMode: EditMode): CanvasCommand {
  if (editMode === 'grab') return 'grab'
  if (editMode === 'extrude') return 'grab'
  if (editMode === 'rotate') return 'rotate'
  if (editMode === 'scale') return 'scale'
  return ''
}
