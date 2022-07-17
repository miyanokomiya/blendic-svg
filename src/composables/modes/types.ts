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

import { IVec2 } from 'okageo'
import { MouseOptions } from '/@/utils/devices'

export type CanvasMode = 'object' | 'edit' | 'pose' | 'weight'
export type CanvasCommand = '' | 'grab' | 'rotate' | 'scale'

export type EditMovement = {
  current: IVec2
  start: IVec2
  ctrl?: boolean
  scale: number
}

export interface PopupMenuItem {
  label: string
  key?: string
  exec?: () => void
  data?: { [key: string]: string }
  children?: PopupMenuItem[]
}

export interface ToolMenuGroup {
  label: string
  items: ToolMenuItem[]
}

export interface ToolMenuItem {
  label: string
  exec?: () => void
  underline?: boolean
  key?: string
  data?: { [key: string]: string }
}

export type CommandExam = { command?: string; title: string }

export type SelectOptions = Pick<MouseOptions, 'shift' | 'ctrl'>

export interface PickerOptions {
  callback: (id: string) => void
  onstart?: () => void
  oncancel?: () => void
  name: string
}
