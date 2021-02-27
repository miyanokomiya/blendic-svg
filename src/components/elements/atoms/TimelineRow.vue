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
  <g :transform="`translate(0, ${index * height})`">
    <rect :width="labelWidth" :height="height" fill="#fff" stroke="black" />
    <text x="4" :y="height / 2" dominant-baseline="central">{{ label }}</text>
  </g>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    labelWidth: {
      type: Number,
      default: 100,
    },
    index: {
      type: Number,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
  },
  setup() {
    return {
      height: 24,
    }
  },
})
</script>
