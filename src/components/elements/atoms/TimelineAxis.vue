<template>
  <g>
    <rect
      x="-100000"
      width="200000"
      :height="headerHeight"
      fill="#fff"
      stroke="#000"
    />
    <g>
      <g
        v-for="(f, i) in frames"
        :key="f"
        :transform="`translate(${i * 48}, 0)`"
      >
        <text
          :y="headerHeight / 2"
          dominant-baseline="central"
          text-anchor="middle"
          >{{ f }}</text
        >
        <line x1="0" :y1="headerHeight" x2="0" y2="20000" stroke="#aaa" />
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

export default defineComponent({
  props: {
    scale: {
      type: Number,
      default: 1,
    },
  },
  setup(props) {
    const frames = computed(() => {
      const log = Math.max(Math.round(Math.log(props.scale) / Math.log(1.1)), 1)
      console.log(log)
      return [...Array(60)].map((_, i) => i * log)
    })

    return {
      headerHeight: 24,
      frames,
    }
  },
})
</script>
