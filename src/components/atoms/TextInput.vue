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
  <div class="input-wrapper">
    <input
      ref="inputEl"
      v-model="draftValue"
      type="text"
      :disabled="disabled"
      :data-keep-focus="keepFocus"
      @change="input"
      @focus="onFocus"
      @blur="onBlur"
    />
    <div v-if="!focused && !disabled" class="input-forward" @click="onClick" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect, onMounted, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    disabled?: boolean
    autofocus?: boolean
    realtime?: boolean
    keepFocus?: boolean
  }>(),
  {
    modelValue: '',
    disabled: false,
    autofocus: false,
    realtime: false,
    keepFocus: false,
  }
)

const emit = defineEmits<{
  (e: 'update:model-value', value: string): void
  (e: 'blur'): void
}>()

const inputEl = ref<HTMLInputElement>()
const focused = ref(props.autofocus)

const draftValue = ref('')

watchEffect(() => {
  draftValue.value = props.modelValue
})

watch(draftValue, () => {
  if (props.realtime) {
    emit('update:model-value', draftValue.value)
  }
})

function input() {
  if (draftValue.value !== props.modelValue) {
    emit('update:model-value', draftValue.value)
  }
}

function onClick() {
  inputEl.value?.focus()
  inputEl.value?.select()
}

onMounted(() => {
  if (props.autofocus) {
    inputEl.value?.focus()
    inputEl.value?.select()
  }
})

function onBlur() {
  focused.value = false
  emit('blur')
}

const onFocus = () => (focused.value = true)
</script>

<style scoped>
.input-wrapper {
  position: relative;
  display: flex;
}
input {
  width: 100%;
}
input:disabled {
  background-color: var(--background-second);
  opacity: 0.5;
  cursor: default;
}
.input-forward {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  cursor: text;
}
</style>
