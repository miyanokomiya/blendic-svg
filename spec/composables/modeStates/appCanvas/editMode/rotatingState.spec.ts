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
import { useRotatingState } from 'src/composables/modeStates/appCanvas/editMode/rotatingState'
import { useModeStateMachine } from '/@/composables/modeStates/core'
import { getBone, getTransform } from '/@/models'

describe('src/composables/modeStates/appCanvas/editMode/rotatingState.ts', () => {
  async function prepare() {
    const ctx = getMockEditCtx()
    const sm = useModeStateMachine(ctx, useRotatingState)
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
      ctx.getBones.mockReturnValue({
        a: getBone({ tail: { x: 10, y: 0 } }),
      })
      ctx.getSelectedBones.mockReturnValue({
        a: getBone({ transform: getTransform({ translate: { x: 10, y: 0 } }) }),
      })

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
        getTransform({ rotate: 45, origin: { x: 5, y: 0 } })
      )

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
      expect(ctx.setEditTransform).toHaveBeenNthCalledWith(
        2,
        getTransform({ rotate: 45, origin: { x: 5, y: 0 } })
      )
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
  })
})
