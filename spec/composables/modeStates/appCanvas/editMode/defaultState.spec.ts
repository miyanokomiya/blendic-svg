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

import { useDefaultState } from 'src/composables/modeStates/appCanvas/editMode/defaultState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/appCanvas/editMode/defaultState.ts', () => {
  function getMockCtx() {
    return {
      requestPointerLock: jest.fn(),
      selectBone: jest.fn(),
      setCommandExams: jest.fn(),
      addBone: jest.fn(),
      selectAllBones: jest.fn(),
    } as any
  }
  async function prepare() {
    const ctx = getMockCtx()
    const sm = useModeStateMachine(ctx, useDefaultState)
    await sm.ready
    return { sm, ctx }
  }

  describe('handle pointerdown: button 0', () => {
    it('empty: should execute "selectArmature"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: 'empty', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.selectBone).toHaveBeenNthCalledWith(1)
      expect(ctx.setCommandExams).toHaveBeenCalled()
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
        expect.anything()
      )
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })
    it('bone-head: should execute "selectArmature"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: 'bone-head', id: 'a' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.selectBone).toHaveBeenNthCalledWith(
        1,
        'a',
        { head: true },
        expect.anything()
      )
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })
    it('bone-tail: should execute "selectArmature"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: 'bone-tail', id: 'a' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.selectBone).toHaveBeenNthCalledWith(
        1,
        'a',
        { tail: true },
        expect.anything()
      )
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })
  })

  describe('handle pointerdown: button 1', () => {
    it('should move to PanningState', async () => {
      const { sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 1 } },
      })
      expect(sm.getStateSummary().label).toBe('PanningState')
    })
  })

  describe('keydown', () => {
    it('A: should execute "addBone"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'A' },
      })
      expect(ctx.addBone).toHaveBeenNthCalledWith(1)
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })
    it('a: should execute "selectAllBones"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'a' },
      })
      expect(ctx.selectAllBones).toHaveBeenNthCalledWith(1)
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })
  })
})
