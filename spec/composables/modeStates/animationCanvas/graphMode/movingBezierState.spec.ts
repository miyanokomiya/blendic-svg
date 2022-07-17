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
import { useMovingBezierState } from 'src/composables/modeStates/animationCanvas/graphMode/movingBezierState'
import { useModeStateMachine } from '/@/composables/modeStates/core'
import { getCurve, getKeyframeBone, getKeyframePoint } from '/@/models/keyframe'

describe('src/composables/modeStates/animationCanvas/graphMode/movingBezierState.ts', () => {
  const options = {
    id: 'a',
    key: 'rotate',
    controls: { controlIn: true },
  }
  const keyFrameA = getKeyframeBone({
    id: 'a',
    points: { rotate: getKeyframePoint({ curve: getCurve('bezier3') }) },
  })
  async function prepare() {
    const ctx = getMockGraphCtx()
    const sm = useModeStateMachine(ctx, () => useMovingBezierState(options))
    await sm.ready
    ctx.setCommandExams.mockReset()
    return { sm, ctx }
  }

  describe('onStart', () => {
    it('should execute "startDragging"', async () => {
      const ctx = getMockGraphCtx()
      const sm = useModeStateMachine(ctx, () => useMovingBezierState(options))
      await sm.ready
      expect(ctx.startDragging).toHaveBeenCalledTimes(1)
    })
  })

  describe('handle pointerdrag', () => {
    it('should execute "updateKeyframes"', async () => {
      const { ctx, sm } = await prepare()
      const data = {
        current: { x: 10, y: 20 },
        start: { x: 0, y: 0 },
        scale: 1,
      }
      ctx.getKeyframes.mockReturnValue({ a: keyFrameA })
      ctx.toCurveControl.mockReturnValue({ x: 1, y: 2 })
      await sm.handleEvent({
        type: 'pointerdrag',
        data,
      })
      expect(ctx.updateKeyframes).toHaveBeenCalledWith(
        {
          a: {
            ...keyFrameA,
            points: {
              ...keyFrameA.points,
              rotate: {
                ...keyFrameA.points.rotate,
                curve: {
                  ...keyFrameA.points.rotate!.curve,
                  controlIn: { x: -9, y: 2 },
                },
              },
            },
          },
        },
        'mock-key'
      )
    })
  })

  describe('handle pointerup: button 0', () => {
    it('empty: should move to "Default"', async () => {
      const { sm } = await prepare()
      await sm.handleEvent({
        type: 'pointerup',
        target: { type: 'empty', id: '' },
        data: { point: { x: 0, y: 0 }, options: { button: 0 } },
      })
      expect(sm.getStateSummary().label).toBe('Default')
    })
  })

  describe('keydown', () => {
    it('Escape: should move to "Default"', async () => {
      const { sm } = await prepare()
      await sm.handleEvent({ type: 'keydown', data: { key: 'Escape' } })
      expect(sm.getStateSummary().label).toBe('Default')
    })
  })
})
