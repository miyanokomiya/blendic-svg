import { IVec2 } from 'okageo'
import type { EditMovement } from '/@/composables/modes/types'
import type { KeyOptions, MouseOptions } from '/@/utils/devices'

type TransitionType = 'break' | 'stack-restart' | 'stack-resume'

export interface ModeStateBase<Context> {
  getLabel: () => string
  shouldRequestPointerLock?: boolean
  onStart: (getContext: () => Context) => Promise<void>
  onEnd: (getContext: () => Context) => Promise<void>
  handleEvent: (
    getContext: () => Context,
    e: ModeStateEvent
  ) => Promise<
    | (() => ModeStateBase<Context>)
    | { getState: () => ModeStateBase<Context>; type: TransitionType }
    | { type: 'break' }
    | void
  >
}

type StateStackItem<C> = {
  state: ModeStateBase<C>
  type?: TransitionType
}

export function useModeStateMachine<Context>(
  getContext: () => ModeStateContextBase & Context,
  getInitialState: () => ModeStateBase<Context>
) {
  const stateStack: StateStackItem<Context>[] = [{ state: getInitialState() }]
  function getCurrentState(): StateStackItem<Context> {
    return stateStack[stateStack.length - 1]
  }
  getCurrentState().state.onStart(getContext)

  function getStateSummary() {
    return {
      label: getCurrentState().state.getLabel(),
    }
  }

  async function handleEvent(event: ModeStateEvent): Promise<void> {
    const ret = await getCurrentState().state.handleEvent(getContext, event)
    if (ret) {
      if (typeof ret === 'function') {
        await switchState(getContext, ret())
      } else if (ret.type !== 'break') {
        await switchState(getContext, ret.getState(), ret.type)
      } else {
        await breakState(getContext)
      }
    }
  }

  async function breakState(getContext: () => ModeStateContextBase & Context) {
    const current = getCurrentState()
    await current.state.onEnd(getContext)

    stateStack.pop()
    if (stateStack.length === 0) {
      stateStack.push({ state: getInitialState() })
    }

    const next = getCurrentState()
    if (current.type !== 'stack-resume') {
      await next.state.onStart(getContext)
    }
    console.log('break', next.state.getLabel())
  }

  async function switchState(
    getContext: () => ModeStateContextBase & Context,
    nextState: ModeStateBase<Context>,
    type?: Exclude<TransitionType, 'break'>
  ): Promise<void> {
    console.log('switch', nextState.getLabel(), type)
    const current = getCurrentState()

    if (
      current.state.shouldRequestPointerLock &&
      !nextState.shouldRequestPointerLock
    ) {
      getContext().exitPointerLock()
    } else if (
      !current.state.shouldRequestPointerLock &&
      nextState.shouldRequestPointerLock
    ) {
      getContext().requestPointerLock()
    }

    const nextItem = { state: nextState, type }

    switch (type) {
      case 'stack-restart':
        await current.state.onEnd(getContext)
        stateStack.push(nextItem)
        break
      case 'stack-resume':
        stateStack.push(nextItem)
        break
      default:
        await current.state.onEnd(getContext)
        stateStack[stateStack.length - 1] = { ...nextItem, type: current.type }
        break
    }

    await nextState.onStart(getContext)
  }

  return {
    getStateSummary,
    handleEvent,
  }
}

export interface ModeStateContextBase {
  requestPointerLock: () => void
  exitPointerLock: () => void
  getTimestamp: () => number
}

export type ModeStateEvent =
  | PointerMoveEvent
  | PointerDragEvent
  | PointerDownEvent
  | PointerUpEvent
  | KeyDownEvent
  | PopupMenuEvent

export interface ModeStateEventBase {
  type: string
}
export interface ModeStateEventWithTarget extends ModeStateEventBase {
  target: ModeEventTarget
}

export interface ModeEventTarget {
  type: string
  id: string
  data?: { [key: string]: string }
}

interface PointerMoveEvent extends ModeStateEventBase {
  type: 'pointermove'
  data: EditMovement
}

interface PointerDragEvent extends ModeStateEventBase {
  type: 'pointerdrag'
  data: EditMovement
}

interface PointerDownEvent extends ModeStateEventWithTarget {
  type: 'pointerdown'
  target: ModeEventTarget
  data: {
    options: MouseOptions
  }
}

interface PointerUpEvent extends ModeStateEventWithTarget {
  type: 'pointerup'
  target: ModeEventTarget
  data: {
    options: MouseOptions
  }
}

interface KeyDownEvent extends ModeStateEventBase {
  type: 'keydown'
  data: KeyOptions
  point?: IVec2
}

interface PopupMenuEvent extends ModeStateEventBase {
  type: 'popupmenu'
  data: {
    key: string
  }
}
