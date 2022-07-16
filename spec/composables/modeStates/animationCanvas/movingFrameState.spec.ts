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
import { useMovingFrameState } from 'src/composables/modeStates/animationCanvas/movingFrameState'
import { useDefaultState } from 'src/composables/modeStates/animationCanvas/actionMode/defaultState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/animationCanvas/movingFrameState.ts', () => {
  async function prepare() {
    const ctx = getMockActionCtx()
    const sm = useModeStateMachine(ctx, useDefaultState)
    await sm.ready
    await sm.handleEvent({
      type: 'pointerdown',
      target: { type: 'frame-control', id: '' },
      data: { point: { x: 0, y: 0 }, options: { button: 0 } },
    })
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "startDragging"', async () => {
      const ctx = getMockActionCtx()
      const sm = useModeStateMachine(ctx, useMovingFrameState)
      await sm.ready
      expect(ctx.startDragging).toHaveBeenCalled()
    })
  })

  describe('handle pointerdrag', () => {
    it('should execute "setCurrentFrame"', async () => {
      const { ctx, sm } = await prepare()
      const data = {
        current: { x: 100, y: 20 },
        start: { x: 0, y: 0 },
        scale: 1,
      }
      await sm.handleEvent({
        type: 'pointerdrag',
        data,
      })
      expect(ctx.setCurrentFrame).toHaveBeenCalledWith(10, 'mock-key')
    })
  })

  describe('handle pointerup', () => {
    it('empty: should execute "setCurrentFrame" and move to "Default"', async () => {
      const { sm, ctx } = await prepare()
      await sm.handleEvent({
        type: 'pointerup',
        target: { type: 'empty', id: '' },
        data: { point: { x: 20, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.setCurrentFrame).toHaveBeenCalledWith(2, 'mock-key')
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
