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
  <div
    ref="root"
    tabindex="-1"
    @mousedown="onDown"
    @mouseenter="onEnter"
    @keydown="onKeydown"
    @keyup="onKeyup"
    @focus="onFocus"
    @blur="onBlur"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { ref, onUnmounted } from 'vue'
import { getKeyOptions, isCopyPasteKeyevent } from '/@/utils/devices'
</script>

<script setup lang="ts">
const emit = defineEmits<{
  (name: 'copy', e: ClipboardEvent): void
  (name: 'paste', e: ClipboardEvent): void
  (name: 'keydown', e: KeyboardEvent): void
  (name: 'keyup', e: KeyboardEvent): void
}>()

const root = ref<HTMLElement>()

function bindGlobal() {
  document.addEventListener('copy', onCopy)
  document.addEventListener('paste', onPaste)
}
function unbindGlobal() {
  document.removeEventListener('copy', onCopy)
  document.removeEventListener('paste', onPaste)
}
onUnmounted(unbindGlobal)

function onCopy(e: ClipboardEvent) {
  emit('copy', e)
}

function onPaste(e: ClipboardEvent) {
  emit('paste', e)
}

function onDown() {
  root.value?.focus()
}

function onEnter() {
  if (!document.activeElement?.getAttribute('data-keep-focus')) {
    root.value?.focus()
  }
}

function onKeydown(e: KeyboardEvent) {
  // The events of copy & paste can be detected only by window
  // => Have to avoid calling "preventDefault"
  if (!isCopyPasteKeyevent(getKeyOptions(e))) {
    e.preventDefault()
  }
  emit('keydown', e)
}
function onKeyup(e: KeyboardEvent) {
  if (!isCopyPasteKeyevent(getKeyOptions(e))) {
    e.preventDefault()
  }
  emit('keyup', e)
}

function onFocus() {
  bindGlobal()
}

function onBlur() {
  unbindGlobal()
}
</script>

<style scoped>
div {
  user-select: none;
  overflow-anchor: none;
  outline: none;
  width: 100%;
  height: 100%;
}
</style>
