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
import { useGrabbingState } from 'src/composables/modeStates/appCanvas/poseMode/grabbingState'
import { useModeStateMachine } from '/@/composables/modeStates/core'
import { getBone } from '/@/models'

describe('src/composables/modeStates/appCanvas/poseMode/grabbingState.ts', () => {
  async function prepare() {
    const ctx = getMockPoseCtx()
    ctx.getBones.mockReturnValue({ a: getBone() })
    ctx.getSelectedBones.mockReturnValue({ a: getBone() })
    const sm = useModeStateMachine(ctx, useGrabbingState)
    await sm.ready
    ctx.setEditTransforms.mockReset()
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "setEditTransforms"', async () => {
      const ctx = getMockPoseCtx()
      const sm = useModeStateMachine(ctx, useGrabbingState)
      await sm.ready
      expect(ctx.setEditTransforms).toHaveBeenNthCalledWith(1, {}, 'grab')
    })
  })

  describe('onEnd', () => {
    it('should init movement', async () => {
      const { ctx, sm } = await prepare()
      await sm.dispose()
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(1)
      expect(ctx.setEditTransforms).toHaveBeenNthCalledWith(1)
    })
  })

  describe('handle pointermove', () => {
    it('empty: should execute "setEditTransforms"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointermove',
        data: {
          start: { x: 1, y: 2 },
          current: { x: 11, y: 22 },
          scale: 1,
        },
      })
      expect(ctx.snapTranslate).toHaveBeenNthCalledWith(1, 0, { x: 10, y: 20 })
      expect(ctx.setEditTransforms).toHaveBeenNthCalledWith(
        1,
        { a: expect.anything() },
        'grab'
      )

      // Activate snapping by "ctrl"
      await sm.handleEvent({
        type: 'pointermove',
        data: {
          start: { x: 1, y: 2 },
          current: { x: 11, y: 22 },
          scale: 1,
          ctrl: true,
        },
      })
      expect(ctx.snapTranslate).toHaveBeenNthCalledWith(2, 10, { x: 10, y: 20 })
    })
  })

  describe('handle pointerup', () => {
    it('button 0: should execute "completeEditTransforms" and move to DefaultState', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerup',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.completeEditTransforms).toHaveBeenNthCalledWith(1)
      expect(sm.getStateSummary().label).toBe('Default')
    })
    it('button 2: should move to DefaultState', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerup',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 2 } },
      })
      expect(ctx.completeEditTransforms).not.toHaveBeenCalled()
      expect(sm.getStateSummary().label).toBe('Default')
    })
  })

  describe('keydown', () => {
    it('Escape: should move to DefaultState', async () => {
      const { sm } = await prepare()
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'Escape' },
      })
      expect(sm.getStateSummary().label).toBe('Default')
    })

    it('x: should execute "setAxisGridInfo" to toggle axis "x"', async () => {
      const { ctx, sm } = await prepare()
      ctx.getAxisGridInfo.mockReturnValue(undefined)
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'x' },
      })
      expect(ctx.setAxisGridInfo).toHaveBeenCalled()
    })

    it('y: should execute "setAxisGridInfo" to toggle axis "y"', async () => {
      const { ctx, sm } = await prepare()
      ctx.getAxisGridInfo.mockReturnValue(undefined)
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'y' },
      })
      expect(ctx.setAxisGridInfo).toHaveBeenCalled()
    })
  })
})
