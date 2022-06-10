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

import { getMockEditCtx } from 'spec/composables/modeStates/appCanvas/mocks'
import { useScalingState } from 'src/composables/modeStates/appCanvas/editMode/scalingState'
import { useModeStateMachine } from '/@/composables/modeStates/core'
import { getBone, getTransform } from '/@/models'

describe('src/composables/modeStates/appCanvas/editMode/scalingState.ts', () => {
  async function prepare() {
    const ctx = getMockEditCtx()
    const sm = useModeStateMachine(ctx, useScalingState)
    await sm.ready
    ctx.setEditTransform.mockReset()
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "setEditTransform"', async () => {
      const ctx = getMockEditCtx()
      const sm = useModeStateMachine(ctx, useScalingState)
      await sm.ready
      expect(ctx.setEditTransform).toHaveBeenNthCalledWith(
        1,
        getTransform(),
        'scale'
      )
    })
  })

  describe('onEnd', () => {
    it('should init movement', async () => {
      const { ctx, sm } = await prepare()
      await sm.dispose()
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(1)
      expect(ctx.setEditTransform).toHaveBeenNthCalledWith(1)
    })
  })

  describe('handle pointermove', () => {
    it('empty: should execute "setEditTransform"', async () => {
      const { ctx, sm } = await prepare()
      ctx.getBones.mockReturnValue({
        a: getBone({ tail: { x: 10, y: 0 } }),
      })
      ctx.getSelectedBones.mockReturnValue({ a: { head: true, tail: true } })

      await sm.handleEvent({
        type: 'pointermove',
        data: {
          start: { x: 10, y: 0 },
          current: { x: 10, y: 5 },
          scale: 1,
        },
      })
      expect(ctx.setEditTransform).toHaveBeenNthCalledWith(
        1,
        getTransform({ scale: { x: 0.1, y: 0.2 }, origin: { x: 5, y: 0 } }),
        'scale'
      )
      expect(ctx.snapScaleDiff).not.toHaveBeenNthCalledWith(1, {
        x: 1.3,
        y: 1.3,
      })

      // Activate snapping by "ctrl"
      await sm.handleEvent({
        type: 'pointermove',
        data: {
          start: { x: 10, y: 0 },
          current: { x: 10, y: 4 },
          scale: 1,
          ctrl: true,
        },
      })
      expect(ctx.snapScaleDiff).toHaveBeenNthCalledWith(2, { x: 1.3, y: 1.3 })
    })
  })

  describe('handle pointerup', () => {
    it('button 0: should execute "completeEditTransform" and move to DefaultState', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerup',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.completeEditTransform).toHaveBeenNthCalledWith(1)
      expect(sm.getStateSummary().label).toBe('Default')
    })
    it('button 2: should move to DefaultState', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerup',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 2 } },
      })
      expect(ctx.completeEditTransform).not.toHaveBeenCalled()
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
      const val = {
        axis: 'x',
        local: false,
        vec: { x: 1, y: 0 },
        origin: expect.anything(),
      }

      ctx.getAxisGridInfo.mockReturnValue(undefined)
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'x' },
      })
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(1, val)

      ctx.getAxisGridInfo.mockReturnValue(val)
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'x' },
      })
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(2)
    })

    it('y: should execute "setAxisGridInfo" to toggle axis "y"', async () => {
      const { ctx, sm } = await prepare()
      const val = {
        axis: 'y',
        local: false,
        vec: { x: 0, y: 1 },
        origin: expect.anything(),
      }

      ctx.getAxisGridInfo.mockReturnValue(undefined)
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'y' },
      })
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(1, val)

      ctx.getAxisGridInfo.mockReturnValue(val)
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'y' },
      })
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(2)
    })
  })
})
