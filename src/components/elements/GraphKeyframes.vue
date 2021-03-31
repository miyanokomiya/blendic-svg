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
    <g v-for="(map, targetId) in keyframePointsMapByTargetId" :key="targetId">
      <GraphKeyPoints
        v-for="(keyFrames, key) in map.props"
        :key="key"
        :point-key="key"
        :key-frames="keyFrames"
        :selected-state-map="selectedKeyframeMap"
        :value-width="valueWidth"
        :color="colorMap[key]"
        :scale="scale"
        @select="select"
        @shift-select="shiftSelect"
      />
    </g>
  </g>
</template>

<script lang="ts">
import { IVec2 } from 'okageo'
import { computed, defineComponent, PropType } from 'vue'
import { useSettings } from '/@/composables/settings'
import { IdMap } from '/@/models'
import {
  KeyframeBase,
  KeyframeBaseProps,
  KeyframeBone,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import { getKeyframeMapByTargetId } from '/@/utils/animations'
import GraphKeyPoints from '/@/components/elements/molecules/GraphKeyPoints.vue'
import { getKeyframePropsMap, inversedSelectedState } from '/@/utils/keyframes'

export default defineComponent({
  components: {
    GraphKeyPoints,
  },
  props: {
    scale: {
      type: Number,
      default: 1,
    },
    viewOrigin: {
      type: Object as PropType<IVec2>,
      default: () => ({ x: 0, y: 0 }),
    },
    keyframeMapByFrame: {
      type: Object as PropType<IdMap<KeyframeBone[]>>,
      default: () => ({}),
    },
    selectedKeyframeMap: {
      type: Object as PropType<IdMap<KeyframeSelectedState>>,
      default: () => ({}),
    },
    colorMap: {
      type: Object as PropType<{ [key: string]: string }>,
      default: () => ({}),
    },
  },
  emits: ['select', 'shift-select'],
  setup(props, { emit }) {
    const { settings } = useSettings()

    const keyframeMapByTargetId = computed(() => {
      return getKeyframeMapByTargetId(
        Object.keys(props.keyframeMapByFrame).flatMap((frame) => {
          return props.keyframeMapByFrame[frame]
        })
      )
    })

    const keyframePointsMapByTargetId = computed(() => {
      return Object.keys(keyframeMapByTargetId.value).reduce<
        IdMap<KeyframeBaseProps<KeyframeBase[]>>
      >((p, c) => {
        p[c] = getKeyframePropsMap(keyframeMapByTargetId.value[c], 'bone')
        return p
      }, {})
    })

    function select(keyframeId: string, state: KeyframeSelectedState) {
      emit('select', keyframeId, state)
    }
    function shiftSelect(keyframeId: string, state: KeyframeSelectedState) {
      emit(
        'shift-select',
        keyframeId,
        inversedSelectedState(
          props.selectedKeyframeMap[keyframeId] ?? {
            name: state.name,
            props: {},
          },
          state
        )
      )
    }

    return {
      keyframePointsMapByTargetId,
      valueWidth: computed(() => settings.graphValueWidth),
      select,
      shiftSelect,
      selectedColor: settings.selectedColor,
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
