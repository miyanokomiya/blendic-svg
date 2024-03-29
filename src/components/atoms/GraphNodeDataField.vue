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
  <div v-if="editableTypes[valueTypeKey]">
    <h5>{{ label }}</h5>
    <template v-if="valueTypeKey === 'SCALER'">
      <SelectField
        v-if="valueEnumKey"
        :model-value="modelValue"
        :options="valueEnumOptions"
        :disabled="disabled"
        no-placeholder
        @update:model-value="update"
      />
      <SliderInput
        v-else
        :step="valueScale"
        :model-value="modelValue"
        :disabled="disabled"
        @update:model-value="update"
      />
    </template>
    <template v-else-if="valueTypeKey === 'BONE'">
      <TextInput v-if="disabled" :model-value="modelValue" disabled />
      <SelectWithPicker
        v-else
        :model-value="modelValue"
        :options="boneOptions"
        name="targetId"
        @update:model-value="update"
        @start-pick="startPickBone"
      />
    </template>
    <template v-else-if="valueTypeKey === 'OBJECT'">
      <TextInput v-if="disabled" :model-value="modelValue" disabled />
      <SelectField
        v-else
        :model-value="modelValue"
        :options="objectOptions"
        @update:model-value="update"
      />
    </template>
    <TextInput
      v-else-if="valueTypeKey === 'TEXT'"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="update"
    />
    <CheckboxInput
      v-else-if="valueTypeKey === 'BOOLEAN'"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="update"
    />
    <template v-else-if="valueTypeKey === 'VECTOR2'">
      <InlineField label="x" label-width="20px">
        <SliderInput
          :model-value="modelValue.x"
          :step="valueScale"
          :disabled="disabled"
          @update:model-value="
            (val, seriesKey) => update({ x: val, y: modelValue.y }, seriesKey)
          "
        />
      </InlineField>
      <InlineField label="y" label-width="20px">
        <SliderInput
          :model-value="modelValue.y"
          :step="valueScale"
          :disabled="disabled"
          @update:model-value="
            (val, seriesKey) => update({ x: modelValue.x, y: val }, seriesKey)
          "
        />
      </InlineField>
    </template>
    <GraphNodeDataFieldTransform
      v-else-if="valueTypeKey === 'TRANSFORM'"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="update"
    />
    <div v-else-if="valueTypeKey === 'COLOR'" class="color-block">
      <OutsideEventContainer
        class="color-field"
        @click-outside="showColorPicker = false"
      >
        <button
          type="button"
          class="color-button"
          :disabled="disabled"
          @click="toggleShowColorPicker"
        >
          <ColorRect :hsva="hsva" />
        </button>
        <div v-if="showColorPicker" class="color-popup">
          <FixedContainer>
            <ColorPicker
              class="color-picker"
              :model-value="hsva"
              extra-hue
              @update:model-value="updateByColor"
            />
          </FixedContainer>
        </div>
      </OutsideEventContainer>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { GRAPH_VALUE_TYPE, ValueType } from '/@/models/graphNode'
import { HSVA, hsvaToTransform } from '/@/utils/color'
import { posedHsva } from '/@/utils/attributesResolver'
import { GraphEnumMap, GraphEnumMapKey } from '/@/models/graphNodeEnums'
import {
  injectGetBoneOptions,
  injectGetObjectOptions,
} from '/@/composables/animationGraph'
import { PickerOptions } from '/@/composables/modes/types'

const editableTypes: { [key in keyof typeof GRAPH_VALUE_TYPE]?: boolean } = {
  [GRAPH_VALUE_TYPE.BOOLEAN]: true,
  [GRAPH_VALUE_TYPE.SCALER]: true,
  [GRAPH_VALUE_TYPE.VECTOR2]: true,
  [GRAPH_VALUE_TYPE.BONE]: true,
  [GRAPH_VALUE_TYPE.OBJECT]: true,
  [GRAPH_VALUE_TYPE.COLOR]: true,
  [GRAPH_VALUE_TYPE.TEXT]: true,
  [GRAPH_VALUE_TYPE.TRANSFORM]: true,
}
</script>

<script lang="ts" setup>
import TextInput from '/@/components/atoms/TextInput.vue'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import SelectField from '/@/components/atoms/SelectField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import ColorPicker from '/@/components/molecules/ColorPicker.vue'
import ColorRect from '/@/components/atoms/ColorRect.vue'
import FixedContainer from '/@/components/atoms/FixedContainer.vue'
import OutsideEventContainer from '/@/components/atoms/OutsideEventContainer.vue'
import GraphNodeDataFieldTransform from '/@/components/atoms/GraphNodeDataFieldTransform.vue'
import SelectWithPicker from '/@/components/molecules/SelectWithPicker.vue'

const props = withDefaults(
  defineProps<{
    modelValue: any
    label: string
    type: ValueType
    disabled?: boolean
  }>(),
  {
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: 'update:model-value', val: any, seriesKey?: string): void
  (e: 'start-pick-bone', val?: PickerOptions): void
}>()

function update(val: any, seriesKey?: string) {
  emit('update:model-value', val, seriesKey)
}

const objectOptions = computed(injectGetObjectOptions())
const boneOptions = computed(injectGetBoneOptions())

const showColorPicker = ref(false)
function toggleShowColorPicker() {
  showColorPicker.value = !showColorPicker.value
}
function updateByColor(hsva: HSVA, seriesKey?: string) {
  update(hsvaToTransform(hsva), seriesKey)
}
const valueTypeKey = computed(() => props.type.type)
const valueScale = computed(() => (props.type as any).scale ?? 1)
const valueEnumKey = computed<GraphEnumMapKey>(
  () => (props.type as any).enumKey
)
const valueEnumOptions = computed(() => {
  return (GraphEnumMap[valueEnumKey.value] ?? []).map((item) => ({
    label: `${item.value}: ${item.key}`,
    value: item.value,
  }))
})

const hsva = computed(() => {
  return valueTypeKey.value === 'COLOR'
    ? posedHsva(props.modelValue)
    : undefined
})

function startPickBone(val?: PickerOptions) {
  emit('start-pick-bone', val)
}
</script>

<style scoped>
h5 {
  margin-bottom: 8px;
}
.color-block {
  display: flex;
  align-items: center;
}
.color-field {
  width: 100%;
}
.color-button {
  width: 100%;
  border: solid 1px var(--weak-border);
}
.color-button > * {
  width: 100%;
}
.color-popup {
  position: relative;
  left: 50%;
  z-index: 1;
}
.color-popup .color-picker {
  position: absolute;
  transform: translateX(-50%);
  border: solid 1px var(--weak-border);
}
</style>
