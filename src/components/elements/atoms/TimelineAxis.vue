<template>
  <g>
    <g :transform="`scale(${scale})`">
      <rect
        x="-100000"
        width="200000"
        :height="headerHeight"
        fill="#fff"
        stroke="#000"
      />
    </g>
    <g>
      <g
        v-for="(f, i) in frames"
        :key="f"
        :transform="`translate(${f * frameWidth}, 0)`"
      >
        <g :transform="`scale(${scale})`">
          <text
            v-if="i % 2 === 0"
            :y="headerHeight - 4"
            :font-size="f % 10 === 0 ? 14 : 11"
            dominant-baseline="text-after-edge"
            text-anchor="middle"
            >{{ f }}</text
          >
          <line
            x1="0"
            :y1="headerHeight"
            x2="0"
            y2="20000"
            stroke="#aaa"
            :stroke-width="f % 10 === 0 ? 2 : 1"
          />
        </g>
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
    originX: {
      type: Number,
      default: 0,
    },
    viewWidth: {
      type: Number,
      default: 100,
    },
  },
  setup(props) {
    const frameWidth = 20

    const scaleLog = computed(() =>
      Math.round(Math.log(props.scale) / Math.log(1.1) / 2)
    )
    const frameInterval = computed(() => {
      return scaleLog.value + 1
    })
    const visibledFrameStart = computed(() => {
      const frame = Math.floor(Math.max(props.originX, 0) / frameWidth)
      return frame - (frame % (frameInterval.value * 2))
    })
    const visibledFrameRange = computed(() => {
      return Math.ceil((props.viewWidth * props.scale) / frameWidth)
    })
    const count = computed(() => {
      return Math.floor(visibledFrameRange.value / frameInterval.value)
    })
    const frames = computed(() => {
      return [...Array(count.value)].map(
        (_, i) => i * frameInterval.value + visibledFrameStart.value
      )
    })

    return {
      headerHeight: 24,
      frames,
      frameWidth,
    }
  },
})
</script>
