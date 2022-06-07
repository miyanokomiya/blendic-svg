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

import {
  getMockEditCtx,
  getMockObjectCtx,
} from 'spec/composables/modeStates/appCanvas/mocks'
import { useObjectGroupState } from '/@/composables/modeStates/appCanvas/objectGroupState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/appCanvas/objectGroupState.ts', () => {
  function getMockCtx() {
    return {
      getObjectContext: getMockObjectCtx,
      getEditContext: getMockEditCtx,
      toggleMode: jest.fn(),
    } as any
  }

  describe('handle keydown: Tab', () => {
    it('should execute "toggleMode"', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useObjectGroupState)
      await sm.ready
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'Tab', shift: false },
      })
      expect(ctx.toggleMode).toHaveBeenNthCalledWith(1, false)
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'Tab', shift: true },
      })
      expect(ctx.toggleMode).toHaveBeenNthCalledWith(2, true)
      expect(sm.getStateSummary().label).toBe('Object:Default')
    })
  })

  describe('handle state: edit', () => {
    it('should move to EditGroupState', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useObjectGroupState)
      await sm.ready
      await sm.handleEvent({
        type: 'state',
        data: { name: 'edit' },
      })
      expect(sm.getStateSummary().label).toBe('Edit:Default')
    })
  })
})
