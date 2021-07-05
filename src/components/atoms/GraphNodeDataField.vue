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
  <div v-if="editableTypes[type]">
    <h5>{{ label }}</h5>
    <TextInput v-if="disabled" :model-value="modelValue" disabled />
    <template v-else>
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
      <CheckboxInput
        v-else-if="type === 'BOOLEAN'"
        :model-value="modelValue"
        @update:modelValue="update"
      />
      <template v-else-if="type === 'VECTOR2'">
        <InlineField label="x" label-width="20px">
          <SliderInput
            :model-value="modelValue.x"
            @update:modelValue="
              (val, seriesKey) => update({ x: val, y: modelValue.y }, seriesKey)
            "
          />
        </InlineField>
        <InlineField label="y" label-width="20px">
          <SliderInput
            :model-value="modelValue.y"
            @update:modelValue="
              (val, seriesKey) => update({ x: modelValue.x, y: val }, seriesKey)
            "
          />
        </InlineField>
      </template>
      <div v-else-if="type === 'COLOR'" class="color-block">
        <button
          type="button"
          class="color-button"
          @click="toggleShowColorPicker"
        >
          <ColorRect :hsva="hsva" />
        </button>
        <div v-if="showColorPicker" class="color-popup">
          <ColorPicker
            class="color-picker"
            :model-value="hsva"
            extra-hue
            @update:modelValue="updateByColor"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, inject } from 'vue'
import { GRAPH_VALUE_TYPE } from '/@/models/graphNode'
import TextInput from '/@/components/atoms/TextInput.vue'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import SelectField from '/@/components/atoms/SelectField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import ColorPicker from '/@/components/molecules/ColorPicker.vue'
import ColorRect from '/@/components/atoms/ColorRect.vue'
import { HSVA, hsvaToTransform } from '/@/utils/color'
import { posedHsva } from '/@/utils/attributesResolver'

const editableTypes: { [key in keyof typeof GRAPH_VALUE_TYPE]?: boolean } = {
  [GRAPH_VALUE_TYPE.BOOLEAN]: true,
  [GRAPH_VALUE_TYPE.SCALER]: true,
  [GRAPH_VALUE_TYPE.VECTOR2]: true,
  [GRAPH_VALUE_TYPE.OBJECT]: true,
  [GRAPH_VALUE_TYPE.COLOR]: true,
}

export default defineComponent({
  components: {
    TextInput,
    SliderInput,
    SelectField,
    CheckboxInput,
    InlineField,
    ColorPicker,
    ColorRect,
  },
  props: {
    modelValue: { type: null, required: true },
    label: { type: String, required: true },
    type: {
      type: String as PropType<keyof typeof GRAPH_VALUE_TYPE>,
      required: true,
    },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function update(val: any, seriesKey?: string) {
      emit('update:modelValue', val, seriesKey)
    }

    const objectOptions = computed(inject('getObjectOptions', () => []))

    const showColorPicker = ref(false)
    function toggleShowColorPicker() {
      showColorPicker.value = !showColorPicker.value
    }
    function updateByColor(hsva: HSVA, seriesKey?: string) {
      update(hsvaToTransform(hsva), seriesKey)
    }
    const hsva = computed(() => {
      return posedHsva(props.modelValue)
    })

    return {
      editableTypes,
      update,
      objectOptions,

      showColorPicker,
      toggleShowColorPicker,
      updateByColor,
      hsva,
    }
  },
})
</script>

<style lang="scss" scoped>
h5 {
  margin-bottom: 8px;
}
.color-block {
  display: flex;
  align-items: center;
}
.color-button {
  width: 100%;
  > * {
    width: 100%;
  }
}
.color-popup {
  position: relative;
  top: 10px;
  left: -50%;
  z-index: 1;
  .color-picker {
    position: fixed;
    transform: translateX(-50%);
    border: solid 1px #aaa;
  }
}
</style>