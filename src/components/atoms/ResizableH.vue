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
    <div ref="left" :style="{ width: leftSize }">
      <slot name="left" :size="leftPx" />
    </div>
    <div v-if="!dense" class="anchor" @mousedown.prevent="onDown">
      <div />
    </div>
    <div ref="right" class="right" :style="{ width: rightSize }">
      <slot name="right" :size="rightPx" />
      <div v-if="dense" class="anchor-dence" @mousedown.prevent="onDown" />
    </div>
  </div>
</template>

<script lang="ts">
import { DragArgs, useDrag } from 'okanvas'
import { clamp } from 'okageo'
import { computed, defineComponent, nextTick, onMounted, ref } from 'vue'
import { useResizableStorage } from '/@/composables/stateStorage'
import { useThrottle } from '/@/composables/throttle'
import { useGlobalMousemove, useGlobalMouseup } from '/@/composables/window'
import { logRound } from '/@/utils/geometry'

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
    dense: {
      type: Boolean,
      default: false,
    },
    storageKey: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const resizableStorage = useResizableStorage(
      props.storageKey,
      props.initialRate
    )

    const root = ref<Element>()
    const left = ref<Element>()
    const right = ref<Element>()
    const rate = ref(resizableStorage.restoredRate)
    const leftPx = ref(100)
    const rightPx = ref(100)
    const anchorSize = computed(() => (props.dense ? 0 : 9))

    const leftSize = computed(() => {
      return `calc((100% - ${anchorSize.value}px) * ${rate.value})`
    })
    const rightSize = computed(() => {
      return `calc((100% - ${anchorSize.value}px) * ${1 - rate.value})`
    })

    function calcSize() {
      leftPx.value = left.value?.getBoundingClientRect().width ?? 100
      rightPx.value = right.value?.getBoundingClientRect().width ?? 100
    }

    async function onDrag(arg: DragArgs) {
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
      resizableStorage.setDirty(true)
      await nextTick()
      calcSize()
      window.dispatchEvent(new Event('resize'))
    }
    const throttleDrag = useThrottle(onDrag, 1000 / 60, true)

    const drag = useDrag(throttleDrag)
    useGlobalMousemove((e) => {
      e.preventDefault()
      drag.onMove(e)
    })
    useGlobalMouseup(() => {
      resizableStorage.save(rate.value)
      drag.onUp()
    })

    onMounted(calcSize)

    return {
      root,
      left,
      right,
      leftPx,
      rightPx,
      leftSize,
      rightSize,
      onDown: drag.onDown,
    }
  },
})
</script>

<style scoped>
.resizable-h-wrapper {
  display: flex;
  align-items: stretch;
  overflow: hidden;
}
.anchor {
  padding: 0 4px;
  cursor: col-resize;
}
.anchor > div {
  width: 1px;
  height: 100%;
}
.anchor:hover > div {
  background-color: var(--weak-border);
}
.right {
  position: relative;
}
.anchor-dence {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  width: 12px;
  cursor: col-resize;
}
</style>
