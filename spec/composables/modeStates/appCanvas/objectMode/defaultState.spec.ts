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

import { useDefaultState } from 'src/composables/modeStates/appCanvas/objectMode/defaultState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/appCanvas/objectMode/defaultState.ts', () => {
  function getMockCtx() {
    return {
      selectArmature: jest.fn(),
      setCommandExams: jest.fn(),
      requestPointerLock: jest.fn(),
      addArmature: jest.fn(),
      selectAllArmatures: jest.fn(),
      deleteArmatures: jest.fn(),
    } as any
  }

  describe('handle pointerdown: button 0', () => {
    it('empty: should execute "selectArmature"', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useDefaultState)
      await sm.ready
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: 'empty', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.selectArmature).toHaveBeenNthCalledWith(1)
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })
    it('armature-body: should execute "selectArmature"', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useDefaultState)
      await sm.ready
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: 'armature-body', id: 'a' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(ctx.selectArmature).toHaveBeenNthCalledWith(1, 'a')
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })
  })

  describe('handle pointerdown: button 1', () => {
    it('should move to PanningState', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useDefaultState)
      await sm.ready
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 1 } },
      })
      expect(sm.getStateSummary().label).toBe('PanningState')
    })
  })

  describe('keydown', () => {
    it('A: should execute "addArmature"', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useDefaultState)
      await sm.ready
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'A' },
      })
      expect(ctx.addArmature).toHaveBeenNthCalledWith(1)
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })
    it('a: should execute "selectAllArmatures"', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useDefaultState)
      await sm.ready
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'a' },
      })
      expect(ctx.selectAllArmatures).toHaveBeenNthCalledWith(1)
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })
    it('x: should execute "deleteArmatures"', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useDefaultState)
      await sm.ready
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'x' },
      })
      expect(ctx.deleteArmatures).toHaveBeenNthCalledWith(1)
      expect(ctx.setCommandExams).toHaveBeenCalled()
    })
  })
})
