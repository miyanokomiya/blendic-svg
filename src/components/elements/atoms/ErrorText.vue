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
  <OutlineRect :dep="errors" :margin-size="{ width: 10, height: 4 }">
    <template #background="props">
      <rect
        :width="props.size.width"
        :height="props.size.height"
        fill="#fff"
        stroke="red"
        stroke-width="2"
      />
    </template>
    <text
      font-size="16"
      font-weight="600"
      fill="red"
      dominant-baseline="text-before-edge"
    >
      <tspan
        v-for="(error, i) in errors"
        :key="i"
        x="0"
        :dy="i === 0 ? 0 : '1.2em'"
      >
        {{ error }}
      </tspan>
    </text>
  </OutlineRect>
</template>

<script lang="ts" setup>
import OutlineRect from '/@/components/elements/atoms/OutlineRect.vue'

defineProps<{
  errors: string[]
}>()
</script>
