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

Copyright (C) 2021, Tomoya Komiyama.
*/

import { add, getNorm, IVec2, multi, sub } from 'okageo'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { getMouseOptions, MouseOptions } from '/@/utils/devices'

const state = reactive({
  size: { width: window.innerWidth, height: window.innerHeight },
})

window.addEventListener('resize', () => {
  state.size = {
    width: window.innerWidth,
    height: window.innerHeight,
  }
})

export function useWindow() {
  return { state }
}

export function useGlobalMousemove(fn: (e: MouseEvent) => void) {
  onMounted(() => {
    window.addEventListener('mousemove', fn)
  })
  onUnmounted(() => {
    window.removeEventListener('mousemove', fn)
  })
  return {}
}

export function useGlobalMouseup(fn: (e: MouseEvent) => void) {
  onMounted(() => {
    window.addEventListener('mouseup', fn)
    window.addEventListener('mouseleave', fn)
  })
  onUnmounted(() => {
    window.removeEventListener('mouseup', fn)
    window.removeEventListener('mouseleave', fn)
  })
  return {}
}

export type PointerType = 'move' | 'move-v' | 'move-h'
export interface PointerMovement extends MouseOptions {
  base: IVec2
  p: IVec2
  d: IVec2
}

export function usePointerLock(handlers: {
  onGlobalMove?: (arg: PointerMovement) => void
  onMove: (arg: PointerMovement) => void
  onUp?: (e: MouseEvent) => void
  onEscape?: () => void
}) {
  let locked = false
  let base: IVec2 = { x: 0, y: 0 }
  const globalCurrent = ref<IVec2>({ x: 0, y: 0 })
  const current = ref<IVec2>()
  const motionRef = ref<PointerType>('move')

  useGlobalMousemove((e) => {
    if (!locked || !current.value) {
      const next = { x: e.pageX, y: e.pageY }
      const d = sub(globalCurrent.value, next)
      globalCurrent.value = next
      handlers.onGlobalMove?.({
        base,
        p: next,
        d,
        ...getMouseOptions(e),
      })
      return
    }

    const d: IVec2 = {
      x: motionRef.value === 'move-v' ? 0 : e.movementX,
      y: motionRef.value === 'move-h' ? 0 : e.movementY,
    }

    // workaround for Chrome's bug
    // https://stackoverflow.com/questions/24853288/pointer-lock-api-entry-is-giving-a-large-number-when-window-is-squished-why
    if (getNorm(d) > 200) return

    const options = getMouseOptions(e)
    // make the distance smaller if shift key is pressed
    current.value = add(current.value, multi(d, options.shift ? 0.1 : 1))
    globalCurrent.value = current.value

    const args = { base, p: current.value, d, ...options }
    handlers.onGlobalMove?.(args)
    handlers.onMove(args)
  })

  function exitPointerLock() {
    current.value = undefined
    document.exitPointerLock()
  }

  useGlobalMouseup((e) => {
    if (locked) {
      exitPointerLock()
      handlers.onUp?.(e)
    }
  })

  function onPointerlockchange() {
    if (locked && !document.pointerLockElement) {
      handlers.onEscape?.()
      locked = false
    }
  }

  document.addEventListener('pointerlockchange', onPointerlockchange)
  onUnmounted(() => {
    document.removeEventListener('pointerlockchange', onPointerlockchange)
  })

  return {
    globalCurrent: computed(() => globalCurrent.value),
    current: computed(() => current.value),
    motion: motionRef,
    requestPointerLock(e: Event, motion: PointerType = 'move') {
      base = globalCurrent.value
      motionRef.value = motion
      current.value = globalCurrent.value
      e.preventDefault()
      ;(e.target as Element).requestPointerLock()
      locked = true
    },
    requestPointerLockFromElement(
      target: Element,
      motion: PointerType = 'move'
    ) {
      base = globalCurrent.value
      motionRef.value = motion
      current.value = globalCurrent.value
      target.requestPointerLock()
      locked = true
    },
    exitPointerLock,
  }
}
