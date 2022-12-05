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

import { getMockCtx } from 'spec/composables/modeStates/animationGraph/mocks'
import { useMovingNodeState } from '/@/composables/modeStates/animationGraph/movingNodeState'
import { useModeStateMachine } from '/@/composables/modeStates/core'
import { createGraphNode } from '/@/utils/graphNodes'

describe('src/composables/modeStates/animationGraph/movingNodeState.ts', () => {
  async function prepare() {
    const ctx = getMockCtx()
    ctx.getSelectedNodeMap.mockReturnValue({ a: createGraphNode('scaler') })

    const sm = useModeStateMachine(ctx, () =>
      useMovingNodeState({ nodeId: 'a' })
    )
    await sm.ready
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "startEditMovement", "startDragging"', async () => {
      const { ctx } = await prepare()
      expect(ctx.startEditMovement).toHaveBeenCalled()
      expect(ctx.startDragging).toHaveBeenCalled()
    })
  })

  describe('handle pointerdrag', () => {
    it('should execute "setEditMovement" if certain time has passed after "onStart"', async () => {
      const { ctx, sm } = await prepare()
      const data = {
        current: { x: 100, y: 20 },
        start: { x: 0, y: 0 },
        scale: 1,
      }

      ctx.getTimestamp.mockReturnValue(50)
      await sm.handleEvent({
        type: 'pointerdrag',
        data,
      })
      expect(ctx.setEditMovement).not.toHaveBeenCalled()

      ctx.getTimestamp.mockReturnValue(150)
      await sm.handleEvent({
        type: 'pointerdrag',
        data,
      })
      expect(ctx.setEditMovement).toHaveBeenCalledWith(data)
    })
  })

  describe('handle pointerup', () => {
    it('should not execute "updateNodes" if no movement detected, then move to "Default"', async () => {
      const { sm, ctx } = await prepare()
      ctx.getEditMovement.mockReturnValue({
        current: { x: 0, y: 0 },
        start: { x: 0, y: 0 },
        scale: 1,
      })
      await sm.handleEvent({
        type: 'pointerup',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })

      expect(ctx.updateNodes).not.toHaveBeenCalled()
      expect(ctx.setEditMovement).toHaveBeenCalledWith()
      expect(sm.getStateSummary().label).toBe('Default')
    })

    it('should execute "updateNodes" if any movement detected, then move to "Default"', async () => {
      const { sm, ctx } = await prepare()
      ctx.getEditMovement.mockReturnValue({
        current: { x: 100, y: 0 },
        start: { x: 0, y: 0 },
        scale: 1,
      })
      await sm.handleEvent({
        type: 'pointerup',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })

      expect(ctx.updateNodes).toHaveBeenCalledWith({
        a: createGraphNode('scaler', { position: { x: 100, y: 0 } }),
      })
      expect(ctx.setEditMovement).toHaveBeenCalledWith()
      expect(sm.getStateSummary().label).toBe('Default')
    })

    it('should not execute "updateNodes" if the button is not left', async () => {
      const { sm, ctx } = await prepare()
      ctx.getEditMovement.mockReturnValue({
        current: { x: 100, y: 0 },
        start: { x: 0, y: 0 },
        scale: 1,
      })
      await sm.handleEvent({
        type: 'pointerup',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 2 } },
      })

      expect(ctx.updateNodes).not.toHaveBeenCalled()
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
