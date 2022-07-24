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
        v-if="inputType === 'COLOR'"
        :transform="modelValue"
        class="color"
      />
      <p v-else>{{ valueText }}</p>
    </div>
  </foreignObject>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { GRAPH_VALUE_TYPE, ValueType } from '/@/models/graphNode'
import ColorRect from '/@/components/atoms/ColorRect.vue'
import { IVec2 } from 'okageo'
import { truncate } from '/@/utils/helpers'
import { injectGetBoneOptions } from '/@/composables/animationGraph'
import { toKeyMap } from '/@/utils/commons'

export default defineComponent({
  components: {
    ColorRect,
  },
  props: {
    modelValue: { type: null, required: true },
    label: { type: String, required: true },
    type: {
      type: Object as PropType<ValueType>,
      required: true,
    },
  },
  emits: ['update:model-value'],
  setup(props, { emit }) {
    function update(val: any, seriesKey?: string) {
      emit('update:model-value', val, seriesKey)
    }

    const inputType = computed(() => props.type.type)

    const boneOptions = computed(() => {
      return toKeyMap(injectGetBoneOptions()(), 'value')
    })

    const valueText = computed(() => {
      switch (props.type.type) {
        case GRAPH_VALUE_TYPE.TEXT:
        case GRAPH_VALUE_TYPE.SCALER:
        case GRAPH_VALUE_TYPE.BOOLEAN:
          return truncate(`${props.modelValue}`, 6)
        case GRAPH_VALUE_TYPE.BONE: {
          const name = boneOptions.value[props.modelValue]?.label ?? ''
          return truncate(`${name}`, 10)
        }
        case GRAPH_VALUE_TYPE.VECTOR2: {
          const v = props.modelValue as IVec2
          return `(${truncate(v.x, 4)},${truncate(v.y, 4)})`
        }
        default:
          return ''
      }
    })

    return {
      update,
      inputType,
      valueText,
    }
  },
})
</script>

<style scoped>
.field {
  text-align: left;
  color: #000;
}
.color {
  width: 60px;
}
</style>
