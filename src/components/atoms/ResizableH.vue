<!--
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
-->

<template>
  <div ref="root" class="resizable-h-wrapper">
    <div :style="{ width: leftSize }">
      <slot name="left" />
    </div>
    <div class="anchor" @mousedown="onDown">
      <div />
    </div>
    <div :style="{ width: rightSize }">
      <slot name="right" />
    </div>
  </div>
</template>

<script lang="ts">
import { useDrag } from 'okanvas'
import { computed, defineComponent, ref } from 'vue'
import { useGlobalMousemove, useGlobalMouseup } from '/@/composables/window'
import { clamp, logRound } from '/@/utils/geometry'

const anchorSize = 9

export default defineComponent({
  props: {
    initialRate: {
      type: Number,
      default: 0.5,
    },
    minRate: {
      type: Number,
      default: 0.1,
    },
    maxRate: {
      type: Number,
      default: 0.9,
    },
  },
  setup(props) {
    const root = ref<Element>()
    const rate = ref(props.initialRate)

    const leftSize = computed(() => {
      return `calc((100% - ${anchorSize}px) * ${rate.value})`
    })
    const rightSize = computed(() => {
      return `calc((100% - ${anchorSize}px) * ${1 - rate.value})`
    })

    const drag = useDrag((arg) => {
      if (!root.value) return

      const rootRect = root.value.getBoundingClientRect()
      rate.value = logRound(
        -5,
        clamp(
          props.minRate,
          props.maxRate,
          (arg.p.x - rootRect.left) / rootRect.width
        )
      )
      window.dispatchEvent(new Event('resize'))
    })
    useGlobalMousemove((e) => {
      e.preventDefault()
      drag.onMove(e)
    })
    useGlobalMouseup(drag.onUp)

    return {
      root,
      leftSize,
      rightSize,
      onDown: drag.onDown,
    }
  },
})
</script>

<style lang="scss" scoped>
.resizable-h-wrapper {
  display: flex;
  align-items: stretch;
  overflow: hidden;
}
.anchor {
  padding: 0 4px;
  cursor: col-resize;
  > div {
    width: 1px;
    height: 100%;
  }
  &:hover > div {
    background-color: #bbb;
  }
}
</style>
