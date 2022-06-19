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

import {
  EditState,
  EditStateContext,
  useEditClipboard,
} from '/@/composables/modeStates/appCanvas/editMode/core'
import { usePanningState } from '/@/composables/modeStates/commons'
import { useGrabbingState } from '/@/composables/modeStates/appCanvas/editMode/grabbingState'
import { useRotatingState } from '/@/composables/modeStates/appCanvas/editMode/rotatingState'
import { useScalingState } from '/@/composables/modeStates/appCanvas/editMode/scalingState'
import { useDeletingState } from '/@/composables/modeStates/appCanvas/editMode/deletingState'
import { BoneSelectedState } from '/@/models'
import { useRectangleSelectingState } from '/@/composables/modeStates/appCanvas/editMode/rectangleSelectingState'
import { getCtrlOrMetaStr } from '/@/utils/devices'
import { usePickingBoneState } from '/@/composables/modeStates/appCanvas/pickingBoneState'

export function useDefaultState(): EditState {
  return state
}

const state: EditState = {
  getLabel: () => 'Default',
  onStart: async (ctx) => {
    onChangeSelection(ctx)
  },
  handleEvent: async (ctx, event) => {
    switch (event.type) {
      case 'pointerdown':
        switch (event.data.options.button) {
          case 0:
            switch (event.target.type) {
              case 'bone-body':
              case 'bone-head':
              case 'bone-tail':
                ctx.selectBone(
                  event.target.id,
                  getBoneSelectedState(event.target.type),
                  event.data.options
                )
                return
              default:
                ctx.selectBones({}, event.data.options.shift)
                return useRectangleSelectingState
            }
          case 1:
            return usePanningState
          default:
            return
        }
      case 'keydown':
        switch (event.data.key) {
          case 'a':
            ctx.selectAllBones()
            return
          case 'A':
            ctx.addBone()
            return
          case 'x': {
            if (ctx.getLastSelectedBoneId()) {
              const point = event.point
              return point ? () => useDeletingState({ point }) : undefined
            }
            return
          }
          case 'e':
            if (ctx.getLastSelectedBoneId()) {
              ctx.extrudeBones()
              return useGrabbingState
            }
            return
          case 'g':
            if (ctx.getLastSelectedBoneId()) {
              return useGrabbingState
            }
            return
          case 'r':
            if (ctx.getLastSelectedBoneId()) {
              return useRotatingState
            }
            return
          case 's':
            if (ctx.getLastSelectedBoneId()) {
              return useScalingState
            }
            return
          case 'D':
            if (ctx.getLastSelectedBoneId()) {
              ctx.duplicateBones()
              return useGrabbingState
            }
            return
          default:
            return
        }
      case 'popupmenu':
        switch (event.data.key) {
          case 'delete':
            ctx.deleteBones()
            return
          case 'dissolve':
            ctx.dissolveBones()
            return
          case 'subdivide':
            ctx.subdivideBones()
            return
          case 'symmetrize':
            ctx.symmetrizeBones()
            return
          default:
            return
        }
      case 'copy': {
        const clipboard = useEditClipboard(ctx)
        clipboard.onCopy(event.nativeEvent)
        return
      }
      case 'paste': {
        const clipboard = useEditClipboard(ctx)
        await clipboard.onPaste(event.nativeEvent)
        return
      }
      case 'selection':
        onChangeSelection(ctx)
        return
      case 'state':
        switch (event.data.name) {
          case 'pick-bone':
            return () => usePickingBoneState(event.data.options as any)
          default:
            return
        }
      default:
        return
    }
  },
}

function onChangeSelection(ctx: EditStateContext) {
  if (ctx.getLastSelectedBoneId()) {
    ctx.setCommandExams([
      { command: 'e', title: 'Extrude' },
      { command: 'g', title: 'Grab' },
      { command: 'r', title: 'Rotate' },
      { command: 's', title: 'Scale' },
      { command: 'a', title: 'All Select' },
      { command: 'A', title: 'Add Bone' },
      { command: 'x', title: 'Delete' },
      { command: 'D', title: 'Duplicate' },
      { command: `${getCtrlOrMetaStr()} + c`, title: 'Clip' },
      { command: `${getCtrlOrMetaStr()} + v`, title: 'Paste' },
    ])
    ctx.setToolMenuGroups([
      {
        label: 'Armature',
        items: [
          { label: 'Subdivide', key: 'subdivide' },
          { label: 'Symmetrize', key: 'symmetrize', underline: true },
          { label: 'Dissolve', key: 'dissolve' },
          { label: 'Delete', key: 'delete' },
        ],
      },
    ])
  } else {
    ctx.setCommandExams([
      { command: 'a', title: 'All Select' },
      { command: 'A', title: 'Add Bone' },
      { command: `${getCtrlOrMetaStr()} + v`, title: 'Paste' },
    ])
    ctx.setToolMenuGroups([])
  }
}

function getBoneSelectedState(type: string): BoneSelectedState {
  switch (type) {
    case 'bone-head':
      return { head: true }
    case 'bone-tail':
      return { tail: true }
    default:
      return { head: true, tail: true }
  }
}
