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

import { useGrabbingState } from 'src/composables/modeStates/appCanvas/editMode/grabbingState'
import { useModeStateMachine } from '/@/composables/modeStates/core'
import { getTransform } from '/@/models'

describe('src/composables/modeStates/appCanvas/editMode/grabbingState.ts', () => {
  function getMockCtx() {
    return {
      requestPointerLock: jest.fn(),
      exitPointerLock: jest.fn(),
      startEditMovement: jest.fn(),
      setEditMovement: jest.fn(),
      getBones: jest.fn().mockReturnValue({}),
      getSelectedBones: jest.fn().mockReturnValue({}),
      snapTranslate: jest.fn().mockReturnValue({ x: 100, y: 200 }),
      setEditTransform: jest.fn(),
      completeEditTransform: jest.fn(),
      setAxisGridInfo: jest.fn(),
      getAxisGridInfo: jest.fn(),
    } as any
  }
  async function prepare() {
    const ctx = getMockCtx()
    const sm = useModeStateMachine(ctx, useGrabbingState)
    await sm.ready
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "startEditMovement"', async () => {
      const { ctx } = await prepare()
      expect(ctx.startEditMovement).toHaveBeenNthCalledWith(1)
    })
  })

  describe('onEnd', () => {
    it('should execute "startEditMovement"', async () => {
      const { ctx, sm } = await prepare()
      await sm.dispose()
      expect(ctx.setAxisGridInfo).toHaveBeenNthCalledWith(1)
      expect(ctx.setEditMovement).toHaveBeenNthCalledWith(1)
    })
  })

  describe('handle pointermove', () => {
    it('empty: should execute "setEditTransform"', async () => {
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
      expect(ctx.setEditTransform).toHaveBeenNthCalledWith(
        1,
        getTransform({
          translate: { x: 100, y: 200 },
        })
      )

      await sm.handleEvent({
        type: 'pointermove',
        data: {
          start: { x: 1, y: 2 },
          current: { x: 11, y: 22 },
          scale: 1,
          ctrl: true,
        },
      })
      expect(ctx.snapTranslate).toHaveBeenNthCalledWith(2, 10, {
        x: 10,
        y: 20,
      })
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