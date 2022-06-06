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
import { SelectOptions } from '/@/composables/modes/types'
import { CanvasStateContext } from '/@/composables/modeStates/commons'
import type { ModeStateBase } from '/@/composables/modeStates/core'
import { Bone, BoneSelectedState, IdMap, Transform } from '/@/models'
import { AxisGridInfo } from '/@/store/canvas'

export interface EditStateContext extends CanvasStateContext {
  getBones: () => IdMap<Bone>
  getLastSelectedBoneId: () => string | undefined
  getSelectedBones: () => IdMap<BoneSelectedState>
  selectBone: (
    id?: string,
    selectedState?: BoneSelectedState,
    options?: SelectOptions,
    ignoreConnection?: boolean
  ) => void
  selectBones: (
    selectedStateMap: IdMap<BoneSelectedState>,
    shift?: boolean
  ) => void
  selectAllBones: () => void
  addBone: () => void
  updateBones: (diffMap: IdMap<Partial<Bone>>) => void
  deleteBones: () => void
  dissolveBones: () => void
  subdivideBones: () => void
  symmetrizeBones: () => void
  duplicateBones: () => void

  setEditTransform: (val?: Transform) => void
  completeEditTransform: () => void
  setAxisGridInfo: (val?: AxisGridInfo) => void
  getAxisGridInfo: () => AxisGridInfo | undefined
  snapTranslate: (size: number, translate: IVec2) => IVec2
}

export interface EditState extends ModeStateBase<EditStateContext> {}
