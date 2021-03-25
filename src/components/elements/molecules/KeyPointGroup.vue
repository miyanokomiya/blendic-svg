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
    <template v-if="isVisible(top)">
      <KeyPoint
        :top="top"
        :selected="selectedAny"
        :same-range-width="sameRangeWidth.all"
        @select="selectAll"
        @shift-select="shiftSelectAll"
      />
    </template>
    <template v-if="expanded">
      <template v-for="(y, key) in childTopMap" :key="key">
        <KeyPoint
          :top="y"
          :selected="selectedState[key]"
          :same-range-width="sameRangeWidth[key]"
          @select="select({ [key]: true })"
          @shift-select="shiftSelect({ [key]: true })"
        />
      </template>
    </template>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import KeyPoint from '/@/components/elements/atoms/KeyPoint.vue'
import { KeyframeBase } from '/@/models/keyframe'
import {
  getAllSelectedState,
  getKeyframeDefaultPropsMap,
  inversedSelectedState,
  isAnySelected,
} from '/@/utils/keyframes'

export default defineComponent({
  components: { KeyPoint },
  props: {
    keyFrame: {
      type: Object as PropType<KeyframeBase>,
      required: true,
    },
    childMap: {
      type: Object as PropType<{
        [key: string]: number
      }>,
      required: true,
    },
    top: {
      type: Number,
      default: 0,
    },
    selectedState: {
      type: Object as PropType<{ [key: string]: boolean }>,
      default: () => ({}),
    },
    expanded: {
      type: Boolean,
      default: false,
    },
    sameRangeWidth: {
      type: Object as PropType<{ [key: string]: number }>,
      default: () => getKeyframeDefaultPropsMap(() => 0),
    },
    height: {
      type: Number,
      default: 24,
    },
    scrollY: {
      type: Number,
      default: 0,
    },
  },
  emits: ['select', 'shift-select'],
  setup(props, { emit }) {
    function isVisible(top: number): boolean {
      return top > props.scrollY + props.height * 1.5
    }
    function getTop(index: number): number {
      return props.top + props.height * (index + 1)
    }

    const selectedAny = computed(() =>
      isAnySelected(props.selectedState as any)
    )

    const childTopMap = computed(() => {
      return Object.keys(props.childMap).reduce<{ [key: string]: number }>(
        (p, c, v) => {
          const top = getTop(v)
          if (c in props.keyFrame && isVisible(top)) p[c] = top
          return p
        },
        {}
      )
    })

    return {
      isVisible,
      childTopMap,
      selectedAny,
      select(state: { [key: string]: boolean }) {
        emit('select', state)
      },
      shiftSelect(state: { [key: string]: boolean }) {
        emit(
          'shift-select',
          inversedSelectedState(props.selectedState as any, state as any)
        )
      },
      selectAll() {
        emit('select', getAllSelectedState())
      },
      shiftSelectAll() {
        emit('shift-select', getAllSelectedState())
      },
    }
  },
})
</script>
