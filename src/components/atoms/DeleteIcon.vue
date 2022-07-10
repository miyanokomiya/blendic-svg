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
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
    <rect
      v-if="!float"
      width="10"
      height="10"
      stroke="none"
      class="fill-background-second"
    />
    <path
      d="M2.5 2.5L7.5 7.5M2.5 7.5L7.5 2.5"
      stroke-linejoin="round"
      fill="none"
      :class="float ? 'stroke-background-second' : 'stroke-background'"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    float: {
      type: Boolean,
      default: false,
    },
  },
})
</script>
