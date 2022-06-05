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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { IVec2 } from 'okageo'
import { Rectangle } from 'okanvas'
import {
  CommandExam,
  EditMovement,
  PopupMenuItem,
} from '/@/composables/modes/types'
import type {
  ModeStateBase,
  ModeStateContextBase,
} from '/@/composables/modeStates/core'

export interface CanvasStateContext extends ModeStateContextBase {
  generateUuid: () => string

  startEditMovement: () => void
  getEditMovement: () => EditMovement | undefined
  setEditMovement: (val?: EditMovement) => void

  panView: (val: EditMovement) => void
  startDragging: () => void
  setRectangleDragging: (val?: boolean) => void
  getDraggedRectangle: () => Rectangle | undefined

  setPopupMenuList: (val?: { items: PopupMenuItem[]; point: IVec2 }) => void
  setCommandExams: (exams?: CommandExam[]) => void
}

export interface CanvasState extends ModeStateBase<CanvasStateContext> {}

export function usePanningState(): CanvasState {
  return panningState
}
const panningState: CanvasState = {
  getLabel: () => 'PanningState',
  shouldRequestPointerLock: true,
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointermove':
        ctx.panView(event.data)
        return
      case 'pointerup':
        return { type: 'break' }
    }
  },
}
