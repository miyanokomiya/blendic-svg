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
  <div ref="root">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGlobalClick } from '/@/composables/window'

const emits = defineEmits<{
  (e: 'click-outside'): void
}>()

const root = ref<Element>()

useGlobalClick((e) => {
  if (!root.value || !e.target || root.value.contains(e.target as Node)) return
  emits('click-outside')
})
</script>
