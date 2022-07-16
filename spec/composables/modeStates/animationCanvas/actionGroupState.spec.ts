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
  getMockActionCtx,
  getMockGraphCtx,
} from 'spec/composables/modeStates/animationCanvas/mocks'
import { useActionGroupState } from '/@/composables/modeStates/animationCanvas/actionGroupState'
import { useModeStateMachine } from '/@/composables/modeStates/core'

describe('src/composables/modeStates/animationCanvas/actionGroupState.ts', () => {
  function getMockCtx() {
    return {
      getActionContext: getMockActionCtx,
      getGraphContext: getMockGraphCtx,
      toggleMode: jest.fn(),
    } as any
  }

  describe('handle keydown: Tab', () => {
    it('should execute "toggleMode"', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useActionGroupState)
      await sm.ready
      await sm.handleEvent({
        type: 'keydown',
        data: { key: 'Tab' },
      })
      expect(ctx.toggleMode).toHaveBeenNthCalledWith(1)
    })
  })

  describe('handle state: graph', () => {
    it('should move to GraphGroupState', async () => {
      const ctx = getMockCtx()
      const sm = useModeStateMachine(ctx, useActionGroupState)
      await sm.ready
      await sm.handleEvent({
        type: 'state',
        data: { name: 'graph' },
      })
      expect(sm.getStateSummary().label).toBe('Graph:Default')
    })
  })
})
