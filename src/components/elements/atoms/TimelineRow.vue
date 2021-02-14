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
