import {
  ModeStateBase,
  useModeStateMachine,
} from '/@/composables/modeStates/core'

describe('src/composables/modeStates/core.ts', () => {
  function getMockState(arg: Partial<ModeStateBase> = {}): ModeStateBase {
    return {
      label: 'test state',
      onStart: jest.fn(),
      onEnd: jest.fn(),
      handleEvent: jest.fn(),
      ...arg,
    }
  }

  describe('useModeStateMachine', () => {
    describe('handleEvent', () => {
      it('should handle the event via current state', async () => {
        const current = getMockState({ label: 'current' })
        const sm = useModeStateMachine(() => current)

        expect(sm.getStateSummary().label).toBe('current')
        await sm.handleEvent({ name: 'test' })
        expect(current.handleEvent).toHaveBeenNthCalledWith(1, { name: 'test' })
        expect(sm.getStateSummary().label).toBe('current')
      })
      it('should switch next state if current state returns it', async () => {
        const current = getMockState({
          label: 'current',
          handleEvent: jest
            .fn()
            .mockResolvedValue(getMockState({ label: 'next' })),
        })
        const sm = useModeStateMachine(() => current)

        expect(sm.getStateSummary().label).toBe('current')
        await sm.handleEvent({ name: 'test' })
        expect(current.handleEvent).toHaveBeenNthCalledWith(1, { name: 'test' })
        expect(sm.getStateSummary().label).toBe('next')
      })
    })
  })
})
