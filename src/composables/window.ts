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

import { onMounted, onUnmounted, reactive } from 'vue'

const state = reactive({
  size: { width: 100, height: 100 },
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
