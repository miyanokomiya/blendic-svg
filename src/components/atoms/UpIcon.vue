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
    :transform="`rotate(${right ? 90 : 0}) scale(1, ${flipped ? -1 : 1})`"
  >
    <rect width="10" height="10" stroke="none" class="fill-background-second" />
    <path
      d="M2 7L8 7L5 2z"
      stroke-linejoin="round"
      stroke="none"
      class="fill-background"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps({
  flipped: { type: Boolean, default: false },
  right: { type: Boolean, default: false },
})
</script>
