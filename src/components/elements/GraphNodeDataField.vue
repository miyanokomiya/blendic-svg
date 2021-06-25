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
  <foreignObject width="100" height="40">
    <!-- FIXME: forms are readonly because those in foreignObject do not work well -->
    <div xmlns="http://www.w3.org/1999/xhtml" class="field">
      <h5>{{ label }}</h5>
      <ColorRect
        v-if="type === 'COLOR'"
        :transform="modelValue"
        class="color"
      />
      <p v-else>{{ modelValue }}</p>
    </div>
  </foreignObject>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject } from 'vue'
import { GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import ColorRect from '/@/components/atoms/ColorRect.vue'

export default defineComponent({
  components: {
    ColorRect,
  },
  props: {
    modelValue: { type: null, required: true },
    label: { type: String, required: true },
    type: {
      type: String as PropType<keyof typeof GRAPH_VALUE_TYPE>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function update(val: any, seriesKey?: string) {
      emit('update:modelValue', val, seriesKey)
    }

    const objectOptions = computed(inject('getObjectOptions', () => []))

    return {
      update,
      objectOptions,
    }
  },
})
</script>

<style lang="scss" scoped>
.field {
  text-align: left;
}
.color {
  width: 60px;
}
</style>
