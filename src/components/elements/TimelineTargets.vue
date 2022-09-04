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
    <rect
      :width="labelWidth"
      height="10000"
      stroke="none"
      class="fill-background"
    />
    <line
      :x1="labelWidth"
      y1="0"
      :x2="labelWidth"
      y2="10000"
      class="stroke-text"
    />
    <g :transform="`translate(0, ${-scrollY})`">
      <g
        v-for="(target, i) in targetList"
        :key="target.id"
        :transform="`translate(0, ${targetTopMap[target.id]})`"
      >
        <TimelineRow
          :label-width="labelWidth"
          :label-height="height"
          :label="target.name"
          :expanded="targetExpandedMap[target.id]"
          show-expanded
          @toggle-expanded="toggleBoneExpanded(target.id)"
        />
        <g v-if="targetExpandedMap[target.id]">
          <TimelineRow
            v-for="[key, y] in Object.entries(childTopMapList[i])"
            :key="key"
            :transform="`translate(10, ${y})`"
            :label-width="labelWidth - 10"
            :label-height="height"
            :label="getLabel(key)"
            :highlight="isSelectedProp(target.id, key)"
            @click.left.exact="clickRow(target.id, key)"
            @click.left.shift.exact="clickRow(target.id, key, true)"
          />
        </g>
      </g>
    </g>
    <g>
      <TimelineRow :label-width="labelWidth" :label-height="height" label="" />
    </g>
    <g :transform="`translate(0, ${height})`">
      <TimelineRow
        :label-width="labelWidth"
        :label-height="height"
        label="Summary"
      />
    </g>
  </g>
</template>

<script lang="ts">
import { computed, withDefaults } from 'vue'
import { IdMap } from '/@/models'
import { getKeyframeTopMap, KeyframeTargetSummary } from '/@/utils/helpers'
import { TargetPropsState } from '/@/composables/stores/targetProps'

function getLabel(label: string): string {
  return (
    {
      translateX: 'Translate X',
      translateY: 'Translate Y',
      rotate: 'Rotate',
      scaleX: 'Scale X',
      scaleY: 'Scale Y',
      influence: 'Influence',
    }[label] ?? ''
  )
}
</script>

<script setup lang="ts">
import TimelineRow from '/@/components/elements/atoms/TimelineRow.vue'

const props = withDefaults(
  defineProps<{
    targetList?: KeyframeTargetSummary[]
    labelWidth?: number
    height?: number
    scrollY?: number
    targetExpandedMap?: IdMap<boolean>
    targetTopMap?: IdMap<number>
    propsStateMap?: IdMap<TargetPropsState>
  }>(),
  {
    targetList: () => [],
    labelWidth: 200,
    height: 24,
    scrollY: 0,
    targetExpandedMap: () => ({}),
    targetTopMap: () => ({}),
    propsStateMap: () => ({}),
  }
)

const emits = defineEmits<{
  (e: 'toggle-target-expanded', val: string): void
  (
    e: 'select',
    val: string,
    propsState: TargetPropsState,
    shift?: boolean
  ): void
}>()

function toggleBoneExpanded(targetId: string) {
  emits('toggle-target-expanded', targetId)
}

const childTopMapList = computed(() => {
  return props.targetList.map((item) =>
    getKeyframeTopMap(props.height, 0, item.children)
  )
})

function isSelectedProp(targetId: string, propName: string): boolean {
  return props.propsStateMap[targetId]?.props[propName] === 'selected'
}

function clickRow(id: string, propKey: string, shift = false) {
  emits(
    'select',
    id,
    { props: { [propKey]: 'selected' } } as TargetPropsState,
    shift
  )
}
</script>
