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

import { getMockActionCtx } from 'spec/composables/modeStates/animationCanvas/mocks'
import { useGrabbingState } from 'src/composables/modeStates/animationCanvas/actionMode/grabbingState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/animationCanvas/actionMode/grabbingState.ts', () => {
  async function prepare() {
    const ctx = getMockActionCtx()
    const sm = useModeStateMachine(ctx, useGrabbingState)
    await sm.ready
    ctx.setCommandExams.mockReset()
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "startEditMovement"', async () => {
      const ctx = getMockActionCtx()
      const sm = useModeStateMachine(ctx, useGrabbingState)
      await sm.ready
      expect(ctx.startEditMovement).toHaveBeenCalledTimes(1)
    })
  })

  describe('onEnd', () => {
    it('should execute "setEditMovement"', async () => {
      const { ctx, sm } = await prepare()
      await sm.dispose()
      expect(ctx.setEditMovement).toHaveBeenCalledTimes(1)
    })
  })

  describe('handle pointermove', () => {
    it('should move to "Default"', async () => {
      const { ctx, sm } = await prepare()
      const data = {
        current: { x: 10, y: 20 },
        start: { x: 0, y: 0 },
        scale: 1,
      }
      await sm.handleEvent({
        type: 'pointermove',
        data,
      })
      expect(ctx.setEditMovement).toHaveBeenCalledWith(data)
    })
  })

  describe('handle pointerup: button 0', () => {
    it('empty: should move to "Default"', async () => {
      const { sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerup',
        target: { type: 'empty', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(sm.getStateSummary().label).toBe('Default')
    })
  })

  describe('keydown', () => {
    it('Escape: should move to "Default"', async () => {
      const { sm } = await prepare()
      await sm.handleEvent({ type: 'keydown', data: { key: 'Escape' } })
      expect(sm.getStateSummary().label).toBe('Default')
    })
  })
})
