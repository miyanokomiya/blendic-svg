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
  <g font-size="14" text-anchor="middle" dominant-baseline="middle">
    <g
      v-for="y in values"
      :key="y"
      :transform="`translate(0, ${y * valueWidth}) scale(${scale})`"
    >
      <g transform="translate(10,0) rotate(-90)">
        <text class="fill-text">{{ y }}</text>
      </g>
      <line x1="16" :x2="viewWidth" stroke="#aaa" />
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useSettings } from '/@/composables/settings'
import * as animations from '/@/utils/animations'

export default defineComponent({
  props: {
    scale: {
      type: Number,
      default: 1,
    },
    originY: {
      type: Number,
      default: 0,
    },
    viewWidth: {
      type: Number,
      default: 100,
    },
    viewHeight: {
      type: Number,
      default: 100,
    },
  },
  setup(props) {
    const { settings } = useSettings()

    const valueInterval = computed(() => {
      return animations.getValueInterval(settings.graphValueWidth, props.scale)
    })
    const visibledValueStart = computed(() => {
      return animations.visibledValueStart(
        settings.graphValueWidth,
        valueInterval.value,
        props.originY
      )
    })
    const visibledFrameRange = computed(() => {
      return Math.ceil(
        (props.viewHeight * props.scale) / settings.graphValueWidth
      )
    })
    const count = computed(() => {
      // add a few count to prevent early overflow
      return Math.ceil(visibledFrameRange.value / valueInterval.value) + 3
    })
    const values = computed((): number[] => {
      return [...Array(count.value)].map((_, i) => {
        return i * valueInterval.value + visibledValueStart.value
      })
    })

    return {
      values,
      valueWidth: computed(() => settings.graphValueWidth),
    }
  },
})
</script>
