<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 10 10"
    :transform="`scale(${flipped ? 1 : -1}, 1)`"
  >
    <rect width="10" height="10" stroke="none" fill="#888" />
    <path d="M2 5L7 2L7 8z" stroke-linejoin="round" stroke="none" fill="#fff" />
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
