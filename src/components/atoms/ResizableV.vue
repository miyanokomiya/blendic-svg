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
    <div class="top" :style="{ height: topSize }">
      <slot name="top" />
    </div>
    <div class="anchor" @mousedown="onDown">
      <div />
    </div>
    <div class="bottom" :style="{ height: bottomSize }">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script lang="ts">
import { useDrag } from 'okanvas'
import { computed, defineComponent, ref } from 'vue'
import { useGlobalMousemove, useGlobalMouseup } from '/@/composables/window'
import { clamp, logRound } from '/@/utils/geometry'

const anchorHeight = 9

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

    const topSize = computed(() => {
      return `calc((100% - ${anchorHeight}px) * ${rate.value})`
    })
    const bottomSize = computed(() => {
      return `calc((100% - ${anchorHeight}px) * ${1 - rate.value})`
    })

    const drag = useDrag((arg) => {
      if (!root.value) return

      const rootRect = root.value.getBoundingClientRect()
      rate.value = logRound(
        -5,
        clamp(
          props.minRate,
          props.maxRate,
          (arg.p.y - rootRect.top) / rootRect.height
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
      topSize,
      bottomSize,
      onDown: drag.onDown,
    }
  },
})
</script>

<style lang="scss" scoped>
.resizable-h-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}
.top {
  width: 100%;
}
.bottom {
  width: 100%;
}
.anchor {
  padding: 4px 0;
  width: 100%;
  cursor: row-resize;
  > div {
    height: 1px;
  }
  &:hover > div {
    background-color: #bbb;
  }
}
</style>
