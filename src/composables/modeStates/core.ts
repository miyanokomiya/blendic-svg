import type { EditMovement } from '/@/composables/modes/types'
import type { KeyOptions, MouseOptions } from '/@/utils/devices'

export interface ModeStateBase<Context> {
  getLabel: () => string
  shouldRequestPointerLock?: boolean
  onStart: (getContext: () => Context) => Promise<void>
  onEnd: (getContext: () => Context) => Promise<void>
  handleEvent: (
    getContext: () => Context,
    e: ModeStateEvent
  ) => Promise<(() => ModeStateBase<Context>) | void>
}

export interface ModeStateContextBase {
  getTimestamp: () => number
}

export function useModeStateMachine<Context>(
  getContext: () => ModeStateContextBase & Context,
  getInitialState: () => ModeStateBase<Context>
) {
  let currentState: ModeStateBase<Context> = getInitialState()
  currentState.onStart(getContext)

  function getStateSummary() {
    return {
      label: currentState.getLabel(),
    }
  }

  async function handleEvent(event: ModeStateEvent): Promise<void> {
    const getNextState = await currentState.handleEvent(getContext, event)
    if (getNextState) {
      await switchState(getContext, getNextState())
    }
  }

  async function switchState(
    getContext: () => ModeStateContextBase & Context,
    nextState: ModeStateBase<Context>
  ): Promise<void> {
    await currentState.onEnd(getContext)

    if (
      currentState.shouldRequestPointerLock &&
      !nextState.shouldRequestPointerLock
    ) {
      getContext().exitPointerLock()
    } else if (
      !currentState.shouldRequestPointerLock &&
      nextState.shouldRequestPointerLock
    ) {
      getContext().requestPointerLock()
    }

    await nextState.onStart(getContext)
    currentState = nextState
  }

  return {
    getStateSummary,
    handleEvent,
  }
}

export interface ModeStateContextBase {
  requestPointerLock: () => void
  exitPointerLock: () => void
}

export type ModeStateEvent =
  | PointerMoveEvent
  | PointerDragEvent
  | PointerDownEvent
  | PointerUpEvent
  | KeyDownEvent

export interface ModeStateEventBase {
  type: string
}

interface EventTarget {
  type: string
  id: string
}

interface PointerMoveEvent extends ModeStateEventBase {
  type: 'pointermove'
  data: EditMovement
}

interface PointerDragEvent extends ModeStateEventBase {
  type: 'pointerdrag'
  data: EditMovement
}

interface PointerDownEvent extends ModeStateEventBase {
  type: 'pointerdown'
  target: EventTarget
  data: {
    options: MouseOptions
  }
}

interface PointerUpEvent extends ModeStateEventBase {
  type: 'pointerup'
  target: EventTarget
  data: {
    options: MouseOptions
  }
}

interface KeyDownEvent extends ModeStateEventBase {
  type: 'keydown'
  data: KeyOptions
}
