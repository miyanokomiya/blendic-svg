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
  getMockEditCtx,
  getMockObjectCtx,
  getMockPoseCtx,
  getMockWeightCtx,
} from 'spec/composables/modeStates/appCanvas/mocks'
import { useEditGroupState } from '/@/composables/modeStates/appCanvas/editGroupState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/appCanvas/editGroupState.ts', () => {
  function getMockCtx() {
    return {
      getObjectContext: getMockObjectCtx,
      getEditContext: getMockEditCtx,
      getPoseContext: getMockPoseCtx,
      getWeightContext: getMockWeightCtx,
      toggleMode: jest.fn(),
    } as any
  }

  describe('handle keydown: Tab', () => {
    it('should execute "toggleMode"', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useEditGroupState)
      await sm.ready
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'Tab', shift: false },
      })
      expect(ctx.toggleMode).toHaveBeenNthCalledWith(1, false)
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'Tab', shift: true },
      })
      expect(ctx.toggleMode).toHaveBeenNthCalledWith(2, true)
      expect(sm.getStateSummary().label).toBe('Edit:Default')
    })
  })

  describe('handle state', () => {
    it('pose: should move to PoseGroupState', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useEditGroupState)
      await sm.ready
      await sm.handleEvent({
        type: 'state',
        data: { name: 'pose' },
      })
      expect(sm.getStateSummary().label).toBe('Pose:Default')
    })
    it('weight: should move to WeightGroupState', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useEditGroupState)
      await sm.ready
      await sm.handleEvent({
        type: 'state',
        data: { name: 'weight' },
      })
      expect(sm.getStateSummary().label).toBe('Weight:Default')
    })
  })
})
