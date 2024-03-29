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
  <g>
    <g class="view-only">
      <g
        v-for="f in frames"
        :key="f.f"
        :transform="`translate(${f.f * frameWidth}, 0) scale(${scale})`"
      >
        <line
          v-if="f.strokeWidth > 0"
          x1="0"
          :y1="headerHeight"
          x2="0"
          y2="20000"
          class="stroke-background-second"
          :stroke-width="f.strokeWidth"
        />
      </g>
    </g>
    <g class="view-only">
      <g
        :transform="`translate(0, ${headerHeight})`"
        stroke="none"
        fill-opacity="0.5"
        class="fill-background-second"
      >
        <g transform="scale(-1, 1)">
          <rect width="200000" height="200000" />
        </g>
        <g :transform="`translate(${endFrameX}, 0)`">
          <rect width="200000" height="200000" />
        </g>
      </g>
    </g>
    <g class="view-only">
      <line
        :transform="`translate(${currentFrameX}, 0) scale(${scale})`"
        x1="0"
        :y1="headerHeight"
        x2="0"
        y2="20000"
        stroke="blue"
        stroke-width="2"
      />
    </g>
    <slot />
    <g :transform="`scale(${scale})`" data-type="frame-control">
      <rect
        x="-100000"
        width="200000"
        :height="headerHeight"
        class="fill-background stroke-text"
      />
    </g>
    <g class="view-only">
      <g
        v-for="f in frames"
        :key="f.f"
        :transform="`translate(${f.f * frameWidth}, 0) scale(${scale})`"
      >
        <text
          v-if="f.labelSize > 0"
          :y="headerHeight - 4"
          :font-size="f.labelSize"
          dominant-baseline="text-after-edge"
          text-anchor="middle"
          class="fill-text"
          >{{ f.f }}</text
        >
      </g>
    </g>
    <g class="view-only">
      <g :transform="`translate(${currentFrameX}, 0) scale(${scale})`">
        <rect
          :x="-currentFrameLabelWidth / 2"
          :y="headerHeight - 22"
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
      </g>
    </g>
  </g>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { frameWidth } from '/@/models'
import * as animations from '/@/utils/animations'

const props = withDefaults(
  defineProps<{
    scale?: number
    originX?: number
    viewWidth?: number
    currentFrame?: number
    endFrame?: number
    headerHeight?: number
  }>(),
  {
    scale: 1,
    originX: 0,
    viewWidth: 100,
    currentFrame: 0,
    endFrame: 60,
    headerHeight: 24,
  }
)

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
  // add a few count to prevent early overflow
  return Math.ceil(visibledFrameRange.value / frameInterval.value) + 3
})
const frames = computed(
  (): {
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
  }
)
const currentFrameX = computed(() => {
  return props.currentFrame * frameWidth
})
const currentFrameLabelWidth = computed(() => {
  return Math.max(props.currentFrame.toString().length, 2) * 10 + 2
})
const endFrameX = computed(() => {
  return props.endFrame * frameWidth
})
</script>
