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

import { getMockWeightCtx } from 'spec/composables/modeStates/appCanvas/mocks'
import { usePickingBoneState } from '/@/composables/modeStates/appCanvas/pickingBoneState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/appCanvas/pickingBoneState.ts', () => {
  function getState() {
    return usePickingBoneState({
      name: 'mock',
      callback: () => {},
    })
  }
  async function prepare() {
    const ctx = getMockWeightCtx()
    const sm = useModeStateMachine(ctx, () => ({
      getLabel: () => 'Default',
      handleEvent: async () => getState,
    }))
    await sm.ready
    await sm.handleEvent({ type: 'state', data: { name: '' } })
    ctx.setCommandExams.mockReset()
    ctx.startPickBone.mockReset()
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should init the context', async () => {
      const ctx = getMockWeightCtx()
      const sm = useModeStateMachine(ctx, getState)
      await sm.ready
      expect(ctx.setCommandExams).toHaveBeenCalled()
      expect(ctx.startPickBone).toHaveBeenNthCalledWith(1, {
        name: 'mock',
        callback: expect.anything(),
      })
    })
  })

  describe('handle pointerdown: button 0', () => {
    it('empty: should execute "pickBone" and move to "Default"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: 'empty', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.pickBone).toHaveBeenNthCalledWith(1)
      expect(sm.getStateSummary().label).toBe('Default')
    })
    it('bone-body: should execute "pickBone" and move to "Default"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: 'bone-body', id: 'a' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.pickBone).toHaveBeenNthCalledWith(1, 'a')
      expect(sm.getStateSummary().label).toBe('Default')
    })
  })

  describe('handle pointerdown: button 1', () => {
    it('should move to Panning', async () => {
      const { sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 1 } },
      })
      expect(sm.getStateSummary().label).toBe('Panning')
    })
  })
})
