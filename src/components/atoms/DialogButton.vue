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
  <button type="button" :class="{ [type]: true }" :disabled="disabled">
    <slot />
  </button>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    type?: 'default' | 'primary'
    disabled?: boolean
  }>(),
  {
    type: 'default',
    disabled: false,
  }
)
</script>

<style scoped>
button {
  padding: 6px 16px;
  border: solid 1px var(--weak-border);
  border-radius: 4px;
  font-size: 14px;
}
button:hover {
  opacity: 0.7;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
.primary {
  background-color: var(--dialog-button-primary);
  color: var(--input-value-primary-text);
}
</style>
