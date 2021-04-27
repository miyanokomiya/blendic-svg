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
  <teleport to="body">
    <svg
      v-if="p"
      class="global-cursor"
      :style="{ transform }"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-20 -20 40 40"
      stroke="none"
      fill="#000"
    >
      <circle r="2" />
      <g v-for="r in rotateList" :key="r" :transform="`rotate(${r})`">
        <path d="M20,0L10,-10L10,10z" />
        <path d="M-20,0L-10,-10L-10,10z" />
      </g>
    </svg>
  </teleport>
</template>

<script lang="ts">
import { IVec2 } from 'okageo'
import { computed, defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    p: {
      type: Object as PropType<IVec2>,
      default: undefined,
    },
    cursor: {
      type: String as PropType<'move' | 'move-v' | 'move-h'>,
      default: 'move',
    },
  },
  setup(props) {
    return {
      transform: computed(
        () => `translate(${props.p.x - 13}px, ${props.p.y - 13}px)`
      ),
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
}
svg {
  width: 26px;
  height: 26px;
}
</style>
