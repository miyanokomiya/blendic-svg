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
    <rect :width="labelWidth" height="10000" stroke="none" fill="#fff" />
    <line :x1="labelWidth" y1="0" :x2="labelWidth" y2="10000" stroke="black" />
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
            v-for="(y, key) in childTopMapList[i]"
            :key="key"
            :transform="`translate(10, ${y})`"
            :label-width="labelWidth - 10"
            :label-height="height"
            :label="getLabel(key as string)"
            :color="
              isSelectedProp(target.id, key as string)
                ? settings.selectedColor
                : undefined
            "
            @click.left.exact="clickRow(target.id, key as string)"
            @click.left.shift.exact="clickRow(target.id, key as string, true)"
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
import { computed, defineComponent, PropType } from 'vue'
import { IdMap } from '/@/models'
import TimelineRow from './atoms/TimelineRow.vue'
import { getKeyframeTopMap, KeyframeTargetSummary } from '/@/utils/helpers'
import { TargetPropsState } from '/@/composables/stores/targetProps'
import { useSettings } from '/@/composables/settings'

export default defineComponent({
  components: {
    TimelineRow,
  },
  props: {
    targetList: {
      type: Array as PropType<KeyframeTargetSummary[]>,
      default: () => [],
    },
    labelWidth: {
      type: Number,
      default: 200,
    },
    height: {
      type: Number,
      default: 24,
    },
    scrollY: {
      type: Number,
      default: 0,
    },
    targetExpandedMap: {
      type: Object as PropType<IdMap<boolean>>,
      default: () => ({}),
    },
    targetTopMap: {
      type: Object as PropType<IdMap<number>>,
      default: () => ({}),
    },
    propsStateMap: {
      type: Object as PropType<IdMap<TargetPropsState>>,
      default: () => ({}),
    },
  },
  emits: ['toggle-target-expanded', 'select'],
  setup(props, { emit }) {
    const { settings } = useSettings()

    function toggleBoneExpanded(targetId: string) {
      emit('toggle-target-expanded', targetId)
    }

    const childTopMapList = computed(() => {
      return props.targetList.map((item) => {
        return getKeyframeTopMap(props.height, 0, item.children)
      })
    })

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

    function isSelectedProp(targetId: string, propName: string): boolean {
      return props.propsStateMap[targetId]?.props[propName] === 'selected'
    }

    function clickRow(id: string, propKey: string, shift = false) {
      emit(
        'select',
        id,
        { props: { [propKey]: 'selected' } } as TargetPropsState,
        shift
      )
    }

    return {
      settings,
      childTopMapList,
      getLabel,
      toggleBoneExpanded,
      isSelectedProp,
      clickRow,
    }
  },
})
</script>
