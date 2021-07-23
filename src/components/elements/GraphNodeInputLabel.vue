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
    <text ref="textRef" dominant-baseline="middle" font-size="14" fill="#000">{{
      inputKey + (valueLabel && !isColor ? ` (${valueLabel})` : '')
    }}</text>
    <rect
      v-if="valueLabel && isColor"
      :x="width + 6"
      y="-6"
      width="12"
      height="12"
      :fill="valueLabel"
    />
  </g>
</template>

<script lang="ts">
import {
  defineComponent,
  nextTick,
  onMounted,
  ref,
  PropType,
  computed,
} from 'vue'
import { injectScale } from '/@/composables/canvas'
import {
  GraphNodeInput,
  GRAPH_VALUE_TYPE,
  ValueType,
} from '/@/models/graphNode'
import { getInputValuePreviewText } from '/@/utils/helpers'

export default defineComponent({
  props: {
    inputKey: {
      type: String,
      required: true,
    },
    input: {
      type: Object as PropType<GraphNodeInput<any>>,
      required: true,
    },
    type: {
      type: Object as PropType<ValueType>,
      required: true,
    },
  },
  setup(props) {
    const textRef = ref<SVGTextElement>()
    const width = ref(0)

    const getScale = injectScale()

    onMounted(async () => {
      await nextTick()
      if (!textRef.value) return 0
      width.value = textRef.value.getBoundingClientRect().width * getScale()
    })

    const valueLabel = computed<string>(() => {
      if (props.input.from) return ''

      return getInputValuePreviewText(props.type, props.input.value)
    })

    const isColor = computed(() => {
      return props.type.type === GRAPH_VALUE_TYPE.COLOR
    })

    return {
      textRef,
      valueLabel,
      isColor,
      width,
    }
  },
})
</script>
