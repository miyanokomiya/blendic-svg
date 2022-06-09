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
import { useDefaultState } from 'src/composables/modeStates/appCanvas/poseMode/defaultState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/appCanvas/poseMode/defaultState.ts', () => {
  async function prepare() {
    const ctx = getMockPoseCtx()
    const sm = useModeStateMachine(ctx, useDefaultState)
    await sm.ready
    ctx.setCommandExams.mockReset()
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "setCommandExams"', async () => {
      const ctx = getMockPoseCtx()
      const sm = useModeStateMachine(ctx, useDefaultState)
      await sm.ready
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })

    it('should execute "setToolMenuGroups"', async () => {
      const ctx = getMockPoseCtx()
      const sm1 = useModeStateMachine(ctx, useDefaultState)
      await sm1.ready
      expect(ctx.setToolMenuGroups).toHaveBeenNthCalledWith(1, [])

      ctx.getLastSelectedBoneId.mockReturnValue('a')
      const sm2 = useModeStateMachine(ctx, useDefaultState)
      await sm2.ready
      expect(ctx.setToolMenuGroups).toHaveBeenNthCalledWith(2, [])
    })
  })

  describe('handle pointerdown: button 0', () => {
    it('empty: should execute "selectArmature" and move to "RectangleSelecting"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: 'empty', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.selectBones).toHaveBeenNthCalledWith(1, {}, undefined)
      expect(sm.getStateSummary().label).toBe('RectangleSelecting')
    })
    it('bone-body: should execute "selectArmature"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: 'bone-body', id: 'a' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.selectBone).toHaveBeenNthCalledWith(
        1,
        'a',
        { head: true, tail: true },
        expect.anything(),
        true
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
    it('a: should execute "selectAllBones"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'a' },
      })
      expect(ctx.selectAllBones).toHaveBeenNthCalledWith(1)
    })

    it('g: should move to "Grabbing" when any bones are selected', async () => {
      const { sm, ctx } = await prepare()
      await sm.handleEvent({ type: 'keydown', data: { key: 'g' } })
      expect(sm.getStateSummary().label).toBe('Default')

      ctx.getLastSelectedBoneId.mockReturnValue('a')
      await sm.handleEvent({ type: 'keydown', data: { key: 'g' } })
      expect(sm.getStateSummary().label).toBe('Grabbing')
    })

    it('r: should move to "Rotating" when any bones are selected', async () => {
      const { sm, ctx } = await prepare()
      await sm.handleEvent({ type: 'keydown', data: { key: 'r' } })
      expect(sm.getStateSummary().label).toBe('Default')

      ctx.getLastSelectedBoneId.mockReturnValue('a')
      await sm.handleEvent({ type: 'keydown', data: { key: 'r' } })
      expect(sm.getStateSummary().label).toBe('Rotating')
    })

    it('s: should move to "Scaling" when any bones are selected', async () => {
      const { sm, ctx } = await prepare()
      await sm.handleEvent({ type: 'keydown', data: { key: 's' } })
      expect(sm.getStateSummary().label).toBe('Default')

      ctx.getLastSelectedBoneId.mockReturnValue('a')
      await sm.handleEvent({ type: 'keydown', data: { key: 's' } })
      expect(sm.getStateSummary().label).toBe('Scaling')
    })

    it('i: should move to "Inserting" when any bones are selected', async () => {
      const { sm, ctx } = await prepare()
      await sm.handleEvent({
        type: 'keydown',
        point: { x: 10, y: 10 },
        data: { key: 'i' },
      })
      expect(sm.getStateSummary().label).toBe('Default')

      ctx.getLastSelectedBoneId.mockReturnValue('a')
      await sm.handleEvent({
        type: 'keydown',
        point: { x: 10, y: 10 },
        data: { key: 'i' },
      })
      expect(sm.getStateSummary().label).toBe('Inserting')
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
