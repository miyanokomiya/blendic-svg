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

import { getMockLabelCtx } from 'spec/composables/modeStates/animationCanvas/mocks'
import { useDefaultState } from 'src/composables/modeStates/animationCanvas/labelMode/defaultState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/animationCanvas/labelMode/defaultState.ts', () => {
  async function prepare() {
    const ctx = getMockLabelCtx()
    const sm = useModeStateMachine(ctx, useDefaultState)
    await sm.ready
    ctx.setCommandExams.mockReset()
    return { sm, ctx }
  }

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

  describe('keydown', () => {
    it('a: should execute "selectAllKeyframes"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'a' },
      })
      expect(ctx.selectAllKeyframes).toHaveBeenNthCalledWith(1)
    })

    it('!, Home: should execute "setViewport"', async () => {
      const { sm, ctx } = await prepare()
      await sm.handleEvent({ type: 'keydown', data: { key: '!' } })
      expect(ctx.setViewport).toHaveBeenNthCalledWith(1)
      await sm.handleEvent({ type: 'keydown', data: { key: 'Home' } })
      expect(ctx.setViewport).toHaveBeenNthCalledWith(2)
    })
  })
})
