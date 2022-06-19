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

Copyright (C) 2022, Tomoya Komiyama.
-->

<template>
  <FieldWithButton>
    <SelectField v-model="value" :options="options" />
    <template #button>
      <button type="button" @click="startPickValue">
        <EyedropperIcon :highlight="active" />
      </button>
    </template>
  </FieldWithButton>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FieldWithButton from '/@/components/atoms/FieldWithButton.vue'
import EyedropperIcon from '/@/components/atoms/EyedropperIcon.vue'
import SelectField from '/@/components/atoms/SelectField.vue'
import { PickerOptions } from '/@/composables/modes/types'

const props = defineProps<{
  modelValue: string
  name: string
  options: { value: string; label: string }[]
}>()

const emits = defineEmits<{
  (e: 'update:model-value', val: any): void
  (e: 'start-pick', val?: PickerOptions): void
}>()

const value = computed({
  get: () => props.modelValue,
  set: (val: any) => {
    emits('update:model-value', val)
  },
})

const active = ref(false)

function startPickValue() {
  if (active.value) {
    emits('start-pick')
  } else {
    emits('start-pick', {
      name: props.name,
      callback: (val) => {
        if (props.options.some((o) => o.value === val)) {
          emits('update:model-value', val)
        }
        active.value = false
      },
      onstart: () => {
        active.value = true
      },
      oncancel: () => {
        active.value = false
      },
    })
  }
}
</script>
