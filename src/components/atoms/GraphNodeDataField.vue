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
  <div>
    <h5>{{ label }}</h5>
    <SliderInput
      v-if="type === 'SCALER'"
      :model-value="modelValue"
      @update:modelValue="update"
    />
    <SelectField
      v-else-if="type === 'OBJECT'"
      :model-value="modelValue"
      :options="objectOptions"
      @update:modelValue="update"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject } from 'vue'
import { GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import SelectField from '/@/components/atoms/SelectField.vue'

export default defineComponent({
  components: {
    SliderInput,
    SelectField,
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
h5 {
  margin-bottom: 8px;
}
</style>
