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
  <div class="color-rect" :style="{ 'background-color': color }" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Transform } from '/@/models'
import { posedColor } from '/@/utils/attributesResolver'
import { HSVA, hsvaToRgba, rednerRGBA } from '/@/utils/color'

const props = defineProps<{
  hsva?: HSVA
  transform?: Transform
}>()

const color = computed(() => {
  if (props.hsva) return rednerRGBA(hsvaToRgba(props.hsva))
  if (props.transform) return posedColor(props.transform)
  return '#000'
})
</script>

<style scoped>
.color-rect {
  display: block;
  min-width: 20px;
  height: 20px;
  border: solid 1px var(--weak-border);
}
</style>
