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
  <div ref="root" class="resizable-v-wrapper">
    <div class="top" :style="{ height: topSize }">
      <slot name="top" />
    </div>
    <div v-if="!dense" class="anchor" @mousedown.prevent="onDown">
      <div />
    </div>
    <div class="bottom" :style="{ height: bottomSize }">
      <slot name="bottom" />
      <div v-if="dense" class="anchor-dence" @mousedown.prevent="onDown" />
    </div>
  </div>
</template>

<script lang="ts">
import { DragArgs, useDrag } from 'okanvas'
import { clamp } from 'okageo'
import { computed, defineComponent, ref, nextTick } from 'vue'
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
    const rate = ref(resizableStorage.restoredRate)
    const anchorSize = computed(() => (props.dense ? 0 : 9))

    const topSize = computed(() => {
      return `calc((100% - ${anchorSize.value}px) * ${rate.value})`
    })
    const bottomSize = computed(() => {
      return `calc((100% - ${anchorSize.value}px) * ${1 - rate.value})`
    })

    async function onDrag(arg: DragArgs) {
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
      resizableStorage.setDirty(true)
      await nextTick()
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
.resizable-v-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}
.top {
  width: 100%;
}
.bottom {
  position: relative;
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
    background-color: var(--weak-border);
  }
}
.anchor-dence {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  transform: translateY(-50%);
  height: 12px;
  cursor: row-resize;
}
</style>
