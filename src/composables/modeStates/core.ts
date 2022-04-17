export interface ModeStateEventBase {
  name: string
}

export interface ModeStateBase {
  label: string
  onStart: () => Promise<void>
  onEnd: () => Promise<void>
  handleEvent: (e: ModeStateEventBase) => Promise<ModeStateBase | undefined>
}

export function useModeStateMachine(getInitialState: () => ModeStateBase) {
  let currentState: ModeStateBase = getInitialState()

  function getStateSummary() {
    return {
      label: currentState.label,
    }
  }

  async function handleEvent(event: ModeStateEventBase): Promise<void> {
    const nextState = await currentState.handleEvent(event)
    if (nextState) {
      await switchState(nextState)
    }
  }

  async function switchState(nextState: ModeStateBase): Promise<void> {
    await currentState.onEnd()
    await nextState.onStart()
    currentState = nextState
  }

  return {
    getStateSummary,
    handleEvent,
  }
}
