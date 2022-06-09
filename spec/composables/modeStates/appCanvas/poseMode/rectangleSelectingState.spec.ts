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
import { useRectangleSelectingState } from 'src/composables/modeStates/appCanvas/poseMode/rectangleSelectingState'
import { useModeStateMachine } from '/@/composables/modeStates/core'
import { getBone } from '/@/models'

describe('src/composables/modeStates/appCanvas/poseMode/rectangleSelectingState.ts', () => {
  async function prepare() {
    const ctx = getMockPoseCtx()
    const sm = useModeStateMachine(ctx, useRectangleSelectingState)
    await sm.ready
    ctx.setRectangleDragging.mockReset()
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "setRectangleDragging"', async () => {
      const ctx = getMockPoseCtx()
      const sm = useModeStateMachine(ctx, useRectangleSelectingState)
      await sm.ready
      expect(ctx.startDragging).toHaveBeenNthCalledWith(1)
      expect(ctx.setRectangleDragging).toHaveBeenNthCalledWith(1, true)
    })
  })

  describe('onEnd', () => {
    it('should init movement', async () => {
      const { ctx, sm } = await prepare()
      await sm.dispose()
      expect(ctx.setRectangleDragging).toHaveBeenNthCalledWith(1)
    })
  })

  describe('handle pointerup', () => {
    it('button 0: should execute "selectBones" and move to DefaultState', async () => {
      const { ctx, sm } = await prepare()
      ctx.getBones.mockReturnValue({
        a: getBone({ id: 'a', head: { x: 20, y: 20 }, tail: { x: 30, y: 20 } }),
        b: getBone({ id: 'b', head: { x: 2, y: 2 }, tail: { x: 3, y: 2 } }),
      })
      ctx.getDraggedRectangle.mockReturnValue({
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      })
      await sm.handleEvent({
        type: 'pointerup',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.selectBones).toHaveBeenNthCalledWith(
        1,
        { b: { head: true, tail: true } },
        undefined
      )
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
  })
})
