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
        :selected="selected"
        :same-range-width="sameRangeWidth"
        @select="select"
        @shift-select="shiftSelect"
      />
    </template>
    <template v-if="expanded">
      <KeyPoint
        v-if="isVisible(top + height) && keyFrame.useTranslate"
        :top="top + height"
        :selected="selected"
        :same-range-width="sameRangeWidth"
      />
      <KeyPoint
        v-if="isVisible(top + height * 2) && keyFrame.useRotate"
        :top="top + height * 2"
        :selected="selected"
        :same-range-width="sameRangeWidth"
      />
      <KeyPoint
        v-if="isVisible(top + height * 3) && keyFrame.useScale"
        :top="top + height * 3"
        :selected="selected"
        :same-range-width="sameRangeWidth"
      />
    </template>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Keyframe } from '/@/models'
import KeyPoint from '/@/components/elements/atoms/KeyPoint.vue'

export default defineComponent({
  components: { KeyPoint },
  props: {
    keyFrame: {
      type: Object as PropType<Keyframe>,
      required: true,
    },
    top: {
      type: Number,
      default: 0,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    expanded: {
      type: Boolean,
      default: false,
    },
    sameRangeWidth: {
      type: Number,
      default: 0,
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

    return {
      isVisible,
      select() {
        emit('select')
      },
      shiftSelect() {
        emit('shift-select')
      },
    }
  },
})
</script>
