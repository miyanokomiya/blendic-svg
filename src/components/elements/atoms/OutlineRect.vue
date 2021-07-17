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
  <g>
    <slot name="background" :size="size" />
    <g
      ref="target"
      :transform="`translate(${marginSize.width}, ${marginSize.height})`"
    >
      <slot />
    </g>
  </g>
</template>

<script lang="ts">
import { Size } from 'okanvas'
import { defineComponent, PropType, ref, watch, onMounted } from 'vue'
import { useGetBBox } from '/@/composables/canvas'

export default defineComponent({
  props: {
    dep: {
      type: null,
      required: true,
    },
    marginSize: {
      type: Object as PropType<Size>,
      default: () => ({ width: 0, height: 0 }),
    },
  },
  setup(props) {
    const target = ref<SVGGraphicsElement>()
    const size = ref({ width: 0, height: 0 })

    const getBBox = useGetBBox()

    function calcSize() {
      if (!target.value) return
      const rect = getBBox(target.value)
      size.value = {
        width: rect.width + props.marginSize.width * 2,
        height: rect.height + props.marginSize.height * 2,
      }
    }

    watch(() => props.dep, calcSize)
    watch(() => props.marginSize, calcSize)
    onMounted(calcSize)

    return {
      target,
      size,
    }
  },
})
</script>
