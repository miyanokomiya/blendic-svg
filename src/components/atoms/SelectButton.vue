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
  <SelectField
    v-model="localValue"
    :options="options"
    placeholder="Add"
    @update:model-value="update"
  />
</template>

<script lang="ts" setup>
import SelectField from '/@/components/atoms/SelectField.vue'
import { nextTick, ref } from 'vue'

withDefaults(
  defineProps<{
    options?: { value: number | string; label: string }[]
  }>(),
  {
    options: () => [],
  }
)

const emit = defineEmits<{
  (e: 'select', value?: number | string): void
}>()

const localValue = ref<number | string>()

async function update() {
  emit('select', localValue.value)
  await nextTick()
  localValue.value = undefined
}
</script>
