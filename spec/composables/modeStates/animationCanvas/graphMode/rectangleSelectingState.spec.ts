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

import { getMockGraphCtx } from 'spec/composables/modeStates/animationCanvas/mocks'
import { useRectangleSelectingState } from 'src/composables/modeStates/animationCanvas/graphMode/rectangleSelectingState'
import { useModeStateMachine } from '/@/composables/modeStates/core'
import { getKeyframeBone, getKeyframePoint } from '/@/models/keyframe'

describe('src/composables/modeStates/animationCanvas/graphMode/rectangleSelectingState.ts', () => {
  async function prepare() {
    const ctx = getMockGraphCtx()
    const sm = useModeStateMachine(ctx, useRectangleSelectingState)
    await sm.ready
    ctx.setRectangleDragging.mockReset()
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "setRectangleDragging"', async () => {
      const ctx = getMockGraphCtx()
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
    const rect = { x: -5, y: -5, width: 10, height: 10 }

    describe('button 0', () => {
      it('should execute "selectKeyframes" and move to DefaultState', async () => {
        const { ctx, sm } = await prepare()
        ctx.getKeyframes.mockReturnValue({
          a: getKeyframeBone({
            id: 'a',
            points: { rotate: getKeyframePoint({ value: 0 }) },
          }),
        })
        ctx.getDraggedRectangle.mockReturnValue(rect)
        ctx.toFrameValue.mockImplementation((p: any) => p)
        await sm.handleEvent({
          type: 'pointerup',
          target: { type: '', id: '' },
          data: { point: { x: 0, y: 0 }, options: { button: 0 } },
        })
        expect(ctx.selectKeyframes).toHaveBeenNthCalledWith(
          1,
          { a: { props: { rotate: true } } },
          undefined
        )
        expect(sm.getStateSummary().label).toBe('Default')
      })
      it('shift: should execute "selectKeyframes" and move to DefaultState', async () => {
        const { ctx, sm } = await prepare()
        ctx.getKeyframes.mockReturnValue({
          a: getKeyframeBone({
            id: 'a',
            points: { rotate: getKeyframePoint({ value: 0 }) },
          }),
        })
        ctx.getDraggedRectangle.mockReturnValue(rect)
        ctx.toFrameValue.mockImplementation((p: any) => p)
        await sm.handleEvent({
          type: 'pointerup',
          target: { type: '', id: '' },
          data: { point: { x: 0, y: 0 }, options: { button: 0, shift: true } },
        })
        expect(ctx.selectKeyframes).toHaveBeenNthCalledWith(
          1,
          { a: { props: { rotate: true } } },
          true
        )
        expect(sm.getStateSummary().label).toBe('Default')
      })
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
