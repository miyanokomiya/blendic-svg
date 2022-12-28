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
        data-type="keyframe-body"
        :data-id="keyFrame.id"
      />
    </template>
    <template v-if="expanded">
      <template v-for="(y, key) in childTopMap" :key="key">
        <KeyPoint
          :top="y"
          :selected="selectedState.props[key]"
          :same-range-width="sameRangeWidth[key]"
          :tooltip="keyFrame.points[key].curve.name"
          data-type="keyframe-prop"
          :data-id="keyFrame.id"
          :data-key="key"
        />
      </template>
    </template>
  </g>
</template>

<script lang="ts" setup>
import KeyPoint from '/@/components/elements/atoms/KeyPoint.vue'
import { computed } from 'vue'
import { KeyframeBase, KeyframeSelectedState } from '/@/models/keyframe'
import { mapFilter } from '/@/utils/commons'
import { getKeyframeTopMap } from '/@/utils/helpers'
import { getKeyframeDefaultPropsMap, isAnySelected } from '/@/utils/keyframes'

const props = withDefaults(
  defineProps<{
    keyFrame: KeyframeBase
    childMap: {
      [key: string]: number
    }
    top?: number
    selectedState?: KeyframeSelectedState
    expanded?: boolean
    sameRangeWidth?: { [key: string]: number }
    height?: number
    scrollY?: number
  }>(),
  {
    top: 0,
    selectedState: () => ({ name: '', props: {} }),
    expanded: false,
    sameRangeWidth: () => getKeyframeDefaultPropsMap(() => 0).props,
    height: 24,
    scrollY: 0,
  }
)

function isVisible(top: number): boolean {
  return top > props.scrollY + props.height * 1.5
}

const selectedAny = computed(() => isAnySelected(props.selectedState))

const childTopMap = computed(() => {
  return mapFilter(
    getKeyframeTopMap(props.height, props.top, props.childMap),
    (top, key) => key in props.keyFrame.points && isVisible(top)
  )
})
</script>
