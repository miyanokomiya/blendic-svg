<template>
  <g fill="black" stroke="black">
    <circle :cx="origin.x" :cy="origin.y" :r="2 * scale" />
    <circle :cx="current.x" :cy="current.y" :r="2 * scale" />
    <line
      :x1="origin.x"
      :y1="origin.y"
      :x2="current.x"
      :y2="current.y"
      :stroke-width="scale"
      :stroke-dasharray="`${2 * scale} ${2 * scale}`"
    />
    <g
      :transform="`translate(${current.x}, ${current.y}) rotate(${rotate}) scale(${scale})`"
    >
      <path d="M-20,0L-10,-10L-10,10z" />
      <path d="M20,0L10,-10L10,10z" />
    </g>
  </g>
</template>

<script lang="ts">
import { getRadian, IVec2 } from 'okageo'
import { defineComponent, PropType, computed } from 'vue'

export default defineComponent({
  props: {
    origin: {
      type: Object as PropType<IVec2>,
      required: true,
    },
    current: {
      type: Object as PropType<IVec2>,
      required: true,
    },
    scale: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    return {
      rotate: computed(
        () => (getRadian(props.current, props.origin) / Math.PI) * 180
      ),
    }
  },
})
</script>

<style lang="scss" scoped></style>
