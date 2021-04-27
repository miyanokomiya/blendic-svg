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

import { add, IVec2 } from 'okageo'
import { onMounted, onUnmounted, reactive, ref } from 'vue'

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

type Motion = 'move' | 'move-v' | 'move-h'

export function usePointerLock(
  onMove: (arg: { base: IVec2; p: IVec2; d: IVec2 }) => void,
  onUp?: () => void
) {
  let locked = false
  let base: IVec2 = { x: 0, y: 0 }
  const current = ref<IVec2>()
  const motionRef = ref<Motion>('move')

  useGlobalMousemove((e) => {
    if (!locked || !current.value) return

    const d: IVec2 = {
      x: motionRef.value === 'move-v' ? 0 : e.movementX,
      y: motionRef.value === 'move-h' ? 0 : e.movementY,
    }
    current.value = add(current.value, d)
    onMove({ base, p: current.value, d })
  })

  useGlobalMouseup(() => {
    document.exitPointerLock()
    locked = false
    current.value = undefined
    onUp?.()
  })

  return {
    current,
    motion: motionRef,
    requestPointerLock(e: MouseEvent, motion: Motion = 'move') {
      base = { x: e.pageX, y: e.pageY }
      motionRef.value = motion
      current.value = base
      e.preventDefault()
      ;(e.target as Element).requestPointerLock()
      locked = true
    },
  }
}
