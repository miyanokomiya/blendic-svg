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
import { useDefaultState } from 'src/composables/modeStates/animationCanvas/graphMode/defaultState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/animationCanvas/graphMode/defaultState.ts', () => {
  async function prepare() {
    const ctx = getMockGraphCtx()
    const sm = useModeStateMachine(ctx, useDefaultState)
    await sm.ready
    ctx.setCommandExams.mockReset()
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "setCommandExams"', async () => {
      const ctx = getMockGraphCtx()
      const sm = useModeStateMachine(ctx, useDefaultState)
      await sm.ready
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })
  })

  describe('handle pointerdown: button 0', () => {
    it('empty: should execute "selectKeyframe"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: 'empty', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.selectKeyframe).toHaveBeenNthCalledWith(1)
    })
    it('keyframe-body: should execute "selectKeyframe"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: 'keyframe-body', id: 'a' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.selectKeyframe).toHaveBeenNthCalledWith(
        1,
        'a',
        expect.anything()
      )
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

  describe('keydown', () => {
    it('a: should execute "selectAllKeyframes"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'a' },
      })
      expect(ctx.selectAllKeyframes).toHaveBeenNthCalledWith(1)
    })

    it('x: should execute "deleteKeyframes" if any keyframes are selected', async () => {
      const { sm, ctx } = await prepare()
      await sm.handleEvent({
        type: 'keydown',
        point: { x: 10, y: 20 },
        data: { key: 'x' },
      })
      expect(ctx.deleteKeyframes).not.toHaveBeenCalled()

      ctx.getLastSelectedKeyframeId.mockReturnValue('a')
      await sm.handleEvent({
        type: 'keydown',
        point: { x: 10, y: 20 },
        data: { key: 'x' },
      })
      expect(ctx.deleteKeyframes).toHaveBeenCalled()
    })

    it('!, Home: should execute "setViewport"', async () => {
      const { sm, ctx } = await prepare()
      await sm.handleEvent({ type: 'keydown', data: { key: '!' } })
      expect(ctx.setViewport).toHaveBeenNthCalledWith(1)
      await sm.handleEvent({ type: 'keydown', data: { key: 'Home' } })
      expect(ctx.setViewport).toHaveBeenNthCalledWith(2)
    })
  })

  describe('selection', () => {
    it('should execute "setCommandExams"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({ type: 'selection' })
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })
  })
})
