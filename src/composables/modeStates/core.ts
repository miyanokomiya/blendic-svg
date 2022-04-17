import { IVec2 } from 'okageo'

export interface ModeStateEvent {
  name: string
  nativeEvent: Event
}

export interface ModeStateBase {
  getLabel: () => string
  onStart: () => Promise<void>
  onEnd: () => Promise<void>
  handleEvent: (e: ModeStateEvent) => Promise<ModeStateBase | void>
}

export interface ModeStateContextBase {
  getPoint: (nativeEvent: Event) => IVec2
}

export function useModeStateMachine(getInitialState: () => ModeStateBase) {
  let currentState: ModeStateBase = getInitialState()

  function getStateSummary() {
    return {
      label: currentState.getLabel(),
    }
  }

  async function handleEvent(event: ModeStateEvent): Promise<void> {
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
