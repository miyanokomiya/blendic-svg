import {
  ModeStateBase,
  useModeStateMachine,
} from '/@/composables/modeStates/core'

describe('src/composables/modeStates/core.ts', () => {
  function getMockState(
    arg: Partial<ModeStateBase<any>> = {}
  ): ModeStateBase<any> {
    return {
      getLabel: () => 'test state',
      onStart: jest.fn(),
      onEnd: jest.fn(),
      handleEvent: jest.fn(),
      ...arg,
    }
  }

  function getCtx() {
    return {}
  }

  describe('useModeStateMachine', () => {
    describe('handleEvent', () => {
      it('should handle the event via current state', async () => {
        const current = getMockState({ getLabel: () => 'current' })
        const sm = useModeStateMachine(getCtx, () => current)

        expect(sm.getStateSummary().label).toBe('current')
        await sm.handleEvent({ type: 'test' } as any)
        expect(current.handleEvent).toHaveBeenNthCalledWith(
          1,
          expect.anything(),
          { type: 'test' }
        )
        expect(sm.getStateSummary().label).toBe('current')
      })
      it('should switch next state if current state returns it', async () => {
        const current = getMockState({
          getLabel: () => 'current',
          handleEvent: jest
            .fn()
            .mockResolvedValue(() => getMockState({ getLabel: () => 'next' })),
        })
        const sm = useModeStateMachine(getCtx, () => current)

        expect(sm.getStateSummary().label).toBe('current')
        await sm.handleEvent({ type: 'test' } as any)
        expect(current.handleEvent).toHaveBeenNthCalledWith(
          1,
          expect.anything(),
          { type: 'test' }
        )
        expect(sm.getStateSummary().label).toBe('next')
      })
    })

    describe('transition: stack-restart', () => {
      it('should stack and restart previous state', async () => {
        const current = getMockState({
          getLabel: () => '0',
          onStart: jest.fn().mockResolvedValue(undefined),
          handleEvent: jest.fn().mockResolvedValue({
            getState: () =>
              getMockState({
                getLabel: () => '1',
                handleEvent: jest.fn().mockResolvedValue({ type: 'break' }),
              }),
            type: 'stack-restart',
          }),
        })
        const sm = useModeStateMachine(getCtx, () => current)

        expect(current.onStart).toHaveBeenCalledTimes(1)
        expect(sm.getStateSummary().label).toBe('0')
        await sm.handleEvent({ type: 'test' } as any)
        expect(current.onEnd).toHaveBeenCalledTimes(1)
        expect(sm.getStateSummary().label).toBe('1')
        await sm.handleEvent({ type: 'test' } as any)
        expect(current.onStart).toHaveBeenCalledTimes(2)
        expect(sm.getStateSummary().label).toBe('0')
      })
    })

    describe('transition: stack-resume', () => {
      it('should stack and resume previous state', async () => {
        const current = getMockState({
          getLabel: () => '0',
          onStart: jest.fn().mockResolvedValue(undefined),
          onEnd: jest.fn().mockResolvedValue(undefined),
          handleEvent: jest.fn().mockResolvedValue({
            getState: () =>
              getMockState({
                getLabel: () => '1',
                handleEvent: jest.fn().mockResolvedValue({ type: 'break' }),
              }),
            type: 'stack-resume',
          }),
        })
        const sm = useModeStateMachine(getCtx, () => current)

        expect(current.onStart).toHaveBeenCalledTimes(1)
        expect(sm.getStateSummary().label).toBe('0')
        await sm.handleEvent({ type: 'test' } as any)
        expect(current.onEnd).toHaveBeenCalledTimes(0)
        expect(sm.getStateSummary().label).toBe('1')
        await sm.handleEvent({ type: 'test' } as any)
        expect(current.onStart).toHaveBeenCalledTimes(1)
        expect(sm.getStateSummary().label).toBe('0')
      })
    })
  })
})
