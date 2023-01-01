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
  <div class="cnavas-mode-panel">
    <button
      type="button"
      :class="{ selected: canvasMode === 'edit' }"
      @click="changeMode('edit')"
    >
      Edit
    </button>
    <button
      type="button"
      :class="{ selected: canvasMode === 'pose' }"
      @click="changeMode('pose')"
    >
      Pose
    </button>
    <button
      type="button"
      :class="{ selected: canvasMode === 'weight' }"
      @click="changeMode('weight')"
    >
      Weight
    </button>
  </div>
</template>

<script lang="ts" setup>
import { CanvasMode } from '/@/composables/modes/types'

defineProps<{
  canvasMode: CanvasMode
}>()

const emit = defineEmits<{
  (e: 'change-mode', canvasMode: CanvasMode): void
}>()

function changeMode(canvasMode: CanvasMode) {
  emit('change-mode', canvasMode)
}
</script>

<style scoped>
.cnavas-mode-panel > button {
  margin-right: 4px;
  width: 70px;
  padding: 2px;
  border: solid 1px var(--strong-border);
  border-radius: 4px;
  font-size: 12px;
  background-color: var(--background);
}
.cnavas-mode-panel > button.selected {
  background-color: var(--input-value-selected-weak);
}
.cnavas-mode-panel > button:last-child {
  margin-right: 0;
}
</style>
