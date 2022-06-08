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

import { getMockPoseCtx } from 'spec/composables/modeStates/appCanvas/mocks'
import { useInsertingState } from 'src/composables/modeStates/appCanvas/poseMode/insertingState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/appCanvas/poseMode/insertingState.ts', () => {
  async function prepare() {
    const ctx = getMockPoseCtx()
    const sm = useModeStateMachine(ctx, () =>
      useInsertingState({ point: { x: 10, y: 20 } })
    )
    await sm.ready
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "setPopupMenuList"', async () => {
      const { ctx } = await prepare()
      expect(ctx.setPopupMenuList).toHaveBeenNthCalledWith(1, {
        items: [...Array(7)].map(() => expect.anything()),
        point: { x: 10, y: 20 },
      })
    })
  })

  describe('onEnd', () => {
    it('should execute "setPopupMenuList"', async () => {
      const { ctx, sm } = await prepare()
      ctx.setPopupMenuList.mockReset()
      await sm.dispose()
      expect(ctx.setPopupMenuList).toHaveBeenNthCalledWith(1)
    })
  })

  describe('handle pointerdown', () => {
    it('button 0: should move to "Default"', async () => {
      const { sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(sm.getStateSummary().label).toBe('Default')
    })

    it('button 1: should move to "Panning"', async () => {
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
    it('Escape: should move to "Default"', async () => {
      const { sm } = await prepare()
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'Escape' },
      })
      expect(sm.getStateSummary().label).toBe('Default')
    })
  })

  describe('popupmenu', () => {
    it('location: should execute "insertKeyframe" and move to "Default"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'popupmenu',
        data: { key: 'location' },
      })
      expect(ctx.insertKeyframe).toHaveBeenNthCalledWith(1, {
        translateX: true,
        translateY: true,
      })
      expect(sm.getStateSummary().label).toBe('Default')
    })
  })
})
