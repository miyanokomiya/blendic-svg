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
import { useDeletingState } from 'src/composables/modeStates/appCanvas/editMode/deletingState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/appCanvas/editMode/deletingState.ts', () => {
  async function prepare() {
    const ctx = getMockEditCtx()
    const sm = useModeStateMachine(ctx, () =>
      useDeletingState({ point: { x: 10, y: 20 } })
    )
    await sm.ready
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "setPopupMenuList"', async () => {
      const { ctx } = await prepare()
      expect(ctx.setPopupMenuList).toHaveBeenNthCalledWith(1, {
        items: [expect.anything(), expect.anything()],
        point: { x: 10, y: 20 },
      })
    })
  })

  describe('onEnd', () => {
    it('should execute "setPopupMenuList"', async () => {
      const { ctx, sm } = await prepare()
      ctx.setPopupMenuList.mockReset()
      await sm.dispose()
      expect(ctx.setPopupMenuList).toHaveBeenNthCalledWith(1)
    })
  })

  describe('handle pointerdown', () => {
    it('button 0: should move to "Default"', async () => {
      const { sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerdown',
        target: { type: '', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(sm.getStateSummary().label).toBe('Default')
    })

    it('button 1: should move to "Panning"', async () => {
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
    it('Escape: should move to "Default"', async () => {
      const { sm } = await prepare()
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'Escape' },
      })
      expect(sm.getStateSummary().label).toBe('Default')
    })
  })

  describe('popupmenu', () => {
    it('delete: should execute "deleteBones" and move to "Default"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'popupmenu',
        data: { key: 'delete' },
      })
      expect(ctx.deleteBones).toHaveBeenNthCalledWith(1)
      expect(sm.getStateSummary().label).toBe('Default')
    })

    it('dissolve: should execute "dissolveBones" and move to "Default"', async () => {
      const { ctx, sm } = await prepare()
      await sm.handleEvent({
        type: 'popupmenu',
        data: { key: 'dissolve' },
      })
      expect(ctx.dissolveBones).toHaveBeenNthCalledWith(1)
      expect(sm.getStateSummary().label).toBe('Default')
    })
  })
})
