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
  <RowBlock class="inline-field" :class="{ between }">
    <label v-if="label" :style="{ width: labelWidth }">{{ label }}</label>
    <div class="inline-content"><slot /></div>
  </RowBlock>
</template>

<script lang="ts" setup>
import RowBlock from '/@/components/atoms/RowBlock.vue'

withDefaults(
  defineProps<{
    label?: string
    labelWidth?: string
    between?: boolean
  }>(),
  {
    label: '',
    labelWidth: undefined,
    between: false,
  }
)
</script>

<style scoped>
.inline-field {
  width: 100%;
  display: flex;
  align-items: center;
}
.inline-field + .inline-field {
  margin-top: 10px;
}
.inline-field > label {
  margin-right: 10px;
  text-align: left;
}
.inline-field .inline-content {
  flex: 1;
  min-width: 50px; /* a magic to fix flex width */
  display: flex;
  align-items: center;
}
.inline-field.between {
  justify-content: space-between;
}
.inline-field.between .inline-content {
  flex: initial;
  min-width: auto;
}
</style>
