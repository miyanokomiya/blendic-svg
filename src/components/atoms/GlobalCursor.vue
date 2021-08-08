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
  <teleport v-if="transform" to="body">
    <svg
      class="global-cursor"
      :class="{ fade: !p }"
      :style="{ transform }"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-20 -20 40 40"
      stroke="none"
      fill="#000"
    >
      <g :transform="`rotate(${rotate})`">
        <circle r="2" />
        <g v-for="r in rotateList" :key="r" :transform="`rotate(${r})`">
          <path d="M20,0L10,-10L10,10z" />
          <path d="M-20,0L-10,-10L-10,10z" />
        </g>
      </g>
    </svg>
    <svg
      v-if="originTransform"
      class="global-cursor"
      :style="{ transform: originTransform }"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-20 -20 40 40"
      stroke="#000"
    >
      <line x1="-10" x2="10" />
      <line y1="-10" y2="10" />
    </svg>
  </teleport>
</template>

<script lang="ts">
import { IVec2, circleClamp } from 'okageo'
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { PointerType, useWindow } from '/@/composables/window'

const margin = 13

export default defineComponent({
  props: {
    p: {
      type: Object as PropType<IVec2>,
      default: undefined,
    },
    cursor: {
      type: String as PropType<PointerType>,
      default: 'move',
    },
    rotate: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const windowState = useWindow()

    const adjustedP = computed(() => {
      if (!props.p) return
      return {
        x: circleClamp(0, windowState.state.size.width, props.p.x),
        y: circleClamp(0, windowState.state.size.height, props.p.y),
      }
    })

    const origin = ref<IVec2>()
    let timer: any = 0

    watch(
      () => props.p,
      (to, from) => {
        if (!from && to) {
          origin.value = to
          clearTimeout(timer)
        } else if (from && !to) {
          timer = setTimeout(() => {
            origin.value = undefined
          }, 200)
        }
      }
    )

    return {
      originTransform: computed(() => {
        if (!origin.value) return
        return `translate(${origin.value.x - margin}px, ${
          origin.value.y - margin
        }px)`
      }),
      transform: computed(() => {
        if (!adjustedP.value) {
          if (!origin.value) return
          return `translate(${origin.value.x - margin}px, ${
            origin.value.y - margin
          }px)`
        }
        return `translate(${adjustedP.value.x - margin}px, ${
          adjustedP.value.y - margin
        }px)`
      }),
      rotateList: computed(() => {
        switch (props.cursor) {
          case 'move':
            return [0, 90]
          case 'move-h':
            return [0]
          case 'move-v':
            return [90]
        }
        return []
      }),
    }
  },
})
</script>

<style lang="scss" scoped>
.global-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  width: 26px;
  height: 26px;
  pointer-events: none;
}
.fade {
  transition: all 0.2s;
  opacity: 0.5;
}
</style>
