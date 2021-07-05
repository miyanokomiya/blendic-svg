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
  <g class="view-only">
    <path :d="pathD" :stroke="stroke" :stroke-width="2.5 * scale" fill="none" />
    <g v-if="selected" fill="none" :stroke="selectedColor" stroke-width="5">
      <circle :cx="from.x" :cy="from.y" r="7" />
      <circle :cx="to.x" :cy="to.y" r="7" />
    </g>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useSettings } from '../../composables/settings'
import { IVec2 } from 'okageo'
import { injectScale } from '/@/composables/canvas'

export default defineComponent({
  props: {
    from: { type: Object as PropType<IVec2>, required: true },
    to: { type: Object as PropType<IVec2>, required: true },
    selected: { type: Boolean, default: false },
  },
  setup(props) {
    const { settings } = useSettings()

    const pathD = computed(() => {
      const xD = Math.sqrt(Math.abs(props.from.x - props.to.x)) * 8
      return `M${props.from.x + 5},${props.from.y} C${props.from.x + xD},${
        props.from.y
      } ${props.to.x - xD},${props.to.y} ${props.to.x - 5},${props.to.y}`
    })

    const scale = computed(injectScale())

    return {
      scale,
      pathD,
      selectedColor: computed(() => settings.selectedColor),
      stroke: computed(() =>
        props.selected ? settings.selectedColor : '#888'
      ),
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>