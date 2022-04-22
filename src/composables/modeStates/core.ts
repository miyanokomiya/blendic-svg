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

import { IVec2 } from 'okageo'
import type { EditMovement } from '/@/composables/modes/types'
import type { KeyOptions, MouseOptions } from '/@/utils/devices'

type TransitionType = 'break' | 'stack-restart' | 'stack-resume'

export interface ModeStateBase<C> {
  getLabel: () => string
  shouldRequestPointerLock?: boolean
  onStart?: (getContext: () => C) => Promise<void>
  onEnd?: (getContext: () => C) => Promise<void>
  handleEvent: (
    getContext: () => C,
    e: ModeStateEvent
  ) => Promise<
    | (() => ModeStateBase<C>)
    | { getState: () => ModeStateBase<C>; type: TransitionType }
    | { type: 'break' }
    | void
  >
}

type StateStackItem<C> = {
  state: ModeStateBase<C>
  type?: TransitionType
}

export function useModeStateMachine<C>(
  getContext: () => ModeStateContextBase & C,
  getInitialState: () => ModeStateBase<C>
) {
  const stateStack: StateStackItem<C>[] = [{ state: getInitialState() }]
  function getCurrentState(): StateStackItem<C> {
    return stateStack[stateStack.length - 1]
  }
  getCurrentState().state.onStart?.(getContext)

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

  async function breakState(getContext: () => ModeStateContextBase & C) {
    const current = getCurrentState()
    await current.state.onEnd?.(getContext)

    stateStack.pop()
    if (stateStack.length === 0) {
      stateStack.push({ state: getInitialState() })
    }

    const next = getCurrentState()
    if (current.type !== 'stack-resume') {
      await next.state.onStart?.(getContext)
    }
    console.log('break', next.state.getLabel())
  }

  async function switchState(
    getContext: () => ModeStateContextBase & C,
    nextState: ModeStateBase<C>,
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
        await current.state.onEnd?.(getContext)
        stateStack.push(nextItem)
        break
      case 'stack-resume':
        stateStack.push(nextItem)
        break
      default:
        await current.state.onEnd?.(getContext)
        stateStack[stateStack.length - 1] = { ...nextItem, type: current.type }
        break
    }

    await nextState.onStart?.(getContext)
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
    point: IVec2
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
