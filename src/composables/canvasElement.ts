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

import { add, IVec2, sub } from 'okageo'
import { ref, watch, onMounted } from 'vue'
import { useCanvas } from '/@/composables/canvas'
import { useWindow } from '/@/composables/window'

export function useCanvasElement(
  getCanvas: () => ReturnType<typeof useCanvas>
) {
  const svg = ref<Element>()
  const wrapper = ref<Element>()

  const windowState = useWindow()
  onMounted(adjustSvgSize)
  watch(() => windowState.state.size, adjustSvgSize)

  function adjustSvgSize() {
    if (!wrapper.value) return
    const rect = wrapper.value.getBoundingClientRect()
    getCanvas().setViewSize({ width: rect.width, height: rect.height })
  }

  function removeRootPosition(p: IVec2): IVec2 | undefined {
    if (!svg.value) return
    // adjust in the canvas
    const svgRect = svg.value.getBoundingClientRect()
    return sub(p, { x: svgRect.left, y: svgRect.top })
  }

  function addRootPosition(p: IVec2): IVec2 | undefined {
    if (!svg.value) return
    // adjust in the canvas
    const svgRect = svg.value.getBoundingClientRect()
    return add(p, { x: svgRect.left, y: svgRect.top })
  }

  return {
    wrapper,
    svg,
    addRootPosition,
    removeRootPosition,
  }
}
