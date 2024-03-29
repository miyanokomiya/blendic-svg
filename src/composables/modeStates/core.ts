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

export type TransitionValue<C, E = ModeStateEvent> =
  | (() => ModeStateBase<C, E>)
  | { getState: () => ModeStateBase<C, E>; type: TransitionType }
  | { type: 'break' }
  | void

export interface ModeStateBase<C, E = ModeStateEvent> {
  getLabel: () => string
  shouldRequestPointerLock?: boolean
  onStart?: (ctx: ModeStateContextBase & C) => Promise<void>
  onEnd?: (ctx: C) => Promise<void>
  handleEvent: (ctx: C, e: E) => Promise<TransitionValue<C, E>>
}

type StateStackItem<C, E = ModeStateEvent> = {
  state: ModeStateBase<C, E>
  type?: TransitionType
}

interface StateMachine<E = ModeStateEvent> {
  getStateSummary: () => { label: string }
  handleEvent: (event: E) => Promise<void>
  dispose: () => Promise<void>
  // This will be resolved when "onStart" of the initial state finishes
  ready: Promise<void>
}

export function useModeStateMachine<C, E = ModeStateEvent>(
  ctx: ModeStateContextBase & C,
  getInitialState: () => ModeStateBase<C, E>
): StateMachine<E> {
  const stateStack: StateStackItem<C, E>[] = [{ state: getInitialState() }]
  function getCurrentState(): StateStackItem<C, E> {
    return stateStack[stateStack.length - 1]
  }
  const ready = getCurrentState().state.onStart?.(ctx) ?? Promise.resolve()

  function getStateSummary() {
    return {
      label: getCurrentState().state.getLabel(),
    }
  }

  async function handleEvent(event: E): Promise<void> {
    const ret = await getCurrentState().state.handleEvent(ctx, event)
    if (ret) {
      if (typeof ret === 'function') {
        await switchState(ctx, ret())
      } else if (ret.type !== 'break') {
        await switchState(ctx, ret.getState(), ret.type)
      } else {
        await breakState(ctx)
      }
    }
  }

  async function breakState(ctx: ModeStateContextBase & C) {
    const current = getCurrentState()
    await current.state.onEnd?.(ctx)

    stateStack.pop()
    if (stateStack.length === 0) {
      stateStack.push({ state: getInitialState() })
    }

    const next = getCurrentState()
    if (current.type !== 'stack-resume') {
      await next.state.onStart?.(ctx)
    }
    // console.log('break', next.state.getLabel())
  }

  async function switchState(
    ctx: ModeStateContextBase & C,
    nextState: ModeStateBase<C, E>,
    type?: Exclude<TransitionType, 'break'>
  ): Promise<void> {
    // console.log('switch', nextState.getLabel(), type)
    const current = getCurrentState()

    if (
      current.state.shouldRequestPointerLock &&
      !nextState.shouldRequestPointerLock
    ) {
      ctx.exitPointerLock()
    } else if (
      !current.state.shouldRequestPointerLock &&
      nextState.shouldRequestPointerLock
    ) {
      ctx.requestPointerLock()
    }

    const nextItem = { state: nextState, type }

    switch (type) {
      case 'stack-restart':
        await current.state.onEnd?.(ctx)
        stateStack.push(nextItem)
        break
      case 'stack-resume':
        stateStack.push(nextItem)
        break
      default:
        await current.state.onEnd?.(ctx)
        stateStack[stateStack.length - 1] = { ...nextItem, type: current.type }
        break
    }

    await nextState.onStart?.(ctx)
  }

  async function dispose() {
    const current = getCurrentState()
    await current.state.onEnd?.(ctx)
    stateStack.length = 0
  }

  return {
    getStateSummary,
    handleEvent,
    dispose,
    ready,
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
  | ChangeStateEvent
  | PopupMenuEvent
  | CopyEvent
  | PasteEvent

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

export interface PointerMoveEvent extends ModeStateEventBase {
  type: 'pointermove'
  data: EditMovement
}

export interface PointerDragEvent extends ModeStateEventBase {
  type: 'pointerdrag'
  data: EditMovement
}

export interface PointerDownEvent extends ModeStateEventWithTarget {
  type: 'pointerdown'
  target: ModeEventTarget
  data: {
    point: IVec2
    options: MouseOptions
  }
}

export interface PointerUpEvent extends ModeStateEventWithTarget {
  type: 'pointerup'
  target: ModeEventTarget
  data: {
    point: IVec2
    options: MouseOptions
  }
}

export interface KeyDownEvent extends ModeStateEventBase {
  type: 'keydown'
  data: KeyOptions
  point?: IVec2
}

export interface ChangeStateEvent extends ModeStateEventBase {
  type: 'state'
  data: {
    name: string
    options?: unknown
  }
}

export interface PopupMenuEvent extends ModeStateEventBase {
  type: 'popupmenu'
  data: { key: string } & { [key: string]: string }
}

export interface CopyEvent extends ModeStateEventBase {
  type: 'copy'
  nativeEvent: ClipboardEvent
}

export interface PasteEvent extends ModeStateEventBase {
  type: 'paste'
  nativeEvent: ClipboardEvent
}

export function useGroupState<C, K, E = ModeStateEvent>(
  getState: () => ModeStateBase<C, E>,
  getInitialState: () => ModeStateBase<K, E>,
  deriveCtx: (ctx: C) => K
): ModeStateBase<C, E> {
  let sm: StateMachine<E> | undefined
  const state = getState()
  return {
    getLabel: () =>
      state.getLabel() + (sm ? `:${sm.getStateSummary().label}` : ''),
    onStart: async (ctx) => {
      await state.onStart?.(ctx)
      sm = useModeStateMachine({ ...ctx, ...deriveCtx(ctx) }, getInitialState)
      await sm.ready
    },
    onEnd: async (ctx) => {
      await sm!.dispose()
      await state.onEnd?.(ctx)
    },
    handleEvent: async (ctx, e) => {
      await sm!.handleEvent(e)
      return await state.handleEvent(ctx, e)
    },
  }
}
