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
          :selected="selectedState.props[key]"
          :same-range-width="sameRangeWidth[key]"
          :tooltip="keyFrame.points[key].curve.name"
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
import { KeyframeBase, KeyframeSelectedState } from '/@/models/keyframe'
import { dropMapIfFalse } from '/@/utils/commons'
import { getKeyframeTopMap } from '/@/utils/helpers'
import {
  getAllSelectedState,
  getKeyframeDefaultPropsMap,
  inversedSelectedState,
  isAllExistSelected,
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
      type: Object as PropType<KeyframeSelectedState>,
      default: () => ({ name: '', props: {} }),
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

    const selectedAny = computed(() => isAnySelected(props.selectedState))

    const childTopMap = computed(() => {
      return dropMapIfFalse(
        getKeyframeTopMap(props.height, props.top, props.childMap),
        (top, key) => key in props.keyFrame.points && isVisible(top)
      )
    })

    return {
      isVisible,
      childTopMap,
      selectedAny,
      select(state: { [key: string]: boolean }) {
        emit('select', {
          ...props.selectedState,
          props: state,
        })
      },
      shiftSelect(state: { [key: string]: boolean }) {
        emit(
          'shift-select',
          inversedSelectedState(props.selectedState, {
            ...props.selectedState,
            props: state,
          })
        )
      },
      selectAll() {
        emit('select', getAllSelectedState(props.keyFrame.name))
      },
      shiftSelectAll() {
        emit(
          'shift-select',
          isAllExistSelected(props.keyFrame, props.selectedState)
            ? { name: props.keyFrame.name, props: {} }
            : getAllSelectedState(props.keyFrame.name)
        )
      },
    }
  },
})
</script>
