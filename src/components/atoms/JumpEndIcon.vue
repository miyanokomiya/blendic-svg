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
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 10 10"
    :transform="`scale(${flipped ? 1 : -1}, 1)`"
  >
    <rect width="10" height="10" stroke="none" fill="#888" />
    <path d="M5 5L8 2L8 8z" stroke-linejoin="round" stroke="none" fill="#fff" />
    <line x1="3" y1="2" x2="3" y2="8" stroke="#fff" stroke-width="1.2" />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    flipped: { type: Boolean, default: false },
  },
})
</script>
