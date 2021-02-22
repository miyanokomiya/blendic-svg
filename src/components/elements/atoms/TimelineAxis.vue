<template>
  <g>
    <g :transform="`scale(${scale})`" @mousedown.left="downCurrentFrame">
      <rect
        x="-100000"
        width="200000"
        :height="headerHeight"
        fill="#fff"
        stroke="#000"
      />
    </g>
    <g class="view-only">
      <g>
        <g
          v-for="f in frames"
          :key="f"
          :transform="`translate(${f.f * frameWidth}, 0)`"
        >
          <g :transform="`scale(${scale})`">
            <text
              v-if="f.labelSize > 0"
              :y="headerHeight - 4"
              :font-size="f.labelSize"
              dominant-baseline="text-after-edge"
              text-anchor="middle"
              >{{ f.f }}</text
            >
            <line
              v-if="f.strokeWidth > 0"
              x1="0"
              :y1="headerHeight"
              x2="0"
              y2="20000"
              stroke="#aaa"
              :stroke-width="f.strokeWidth"
            />
          </g>
        </g>
      </g>
      <g fill="#aaa" stroke="none" fill-opacity="0.5">
        <g transform="scale(-1, 1)">
          <rect width="200000" height="200000" />
        </g>
        <g :transform="`translate(${endFrameX}, 0)`">
          <rect width="200000" height="200000" />
        </g>
      </g>
      <g :transform="`translate(${currentFrameX}, 0) scale(${scale})`">
        <rect
          :x="-currentFrameLabelWidth / 2"
          :y="2"
          :width="currentFrameLabelWidth"
          :height="20"
          rx="4"
          ry="4"
          fill="blue"
          stroke="none"
        />
        <text
          :y="headerHeight - 4"
          font-size="12"
          dominant-baseline="text-after-edge"
          text-anchor="middle"
          fill="#fff"
          >{{ currentFrame }}</text
        >
        <line
          x1="0"
          :y1="headerHeight"
          x2="0"
          y2="20000"
          stroke="blue"
          stroke-width="2"
        />
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { frameWidth } from '/@/models'
import * as animations from '/@/utils/animations'

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
    currentFrame: {
      type: Number,
      default: 0,
    },
    endFrame: {
      type: Number,
      default: 60,
    },
  },
  emits: ['down-current-frame', 'up-current-frame'],
  setup(props, { emit }) {
    const frameInterval = computed(() => {
      return animations.getFrameInterval(props.scale)
    })
    const visibledFrameStart = computed(() => {
      return animations.visibledFrameStart(frameInterval.value, props.originX)
    })
    const visibledFrameRange = computed(() => {
      return Math.ceil((props.viewWidth * props.scale) / frameWidth)
    })
    const count = computed(() => {
      return Math.floor(visibledFrameRange.value / frameInterval.value)
    })
    const frames = computed((): {
      f: number
      labelSize: number
      strokeWidth: number
    }[] => {
      return [...Array(count.value)].map((_, i) => {
        const f = i * frameInterval.value + visibledFrameStart.value
        return {
          f,
          labelSize: f % 10 === 0 ? 14 : f % 5 === 0 ? 11 : 0,
          strokeWidth: f % 10 === 0 ? 2 : 1,
        }
      })
    })
    const currentFrameX = computed(() => {
      return props.currentFrame * frameWidth
    })
    const currentFrameLabelWidth = computed(() => {
      return Math.max(props.currentFrame.toString().length, 2) * 10 + 2
    })
    const endFrameX = computed(() => {
      return props.endFrame * frameWidth
    })

    return {
      headerHeight: 24,
      frames,
      frameWidth,
      currentFrameX,
      endFrameX,
      currentFrameLabelWidth,
      downCurrentFrame: () => emit('down-current-frame'),
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
