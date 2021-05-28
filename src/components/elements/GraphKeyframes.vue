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
    <g>
      <g
        v-for="(
          map, targetId
        ) in keyframePointsMapByTargetIdFilteredFocused.falseMap"
        :key="targetId"
      >
        <GraphKeyPoints
          v-for="(keyFrames, key) in map.props"
          :key="key"
          :point-key="key"
          :keyframes="getKeyframes(targetId, key)"
          :selected-state-map="selectedKeyframeMap"
          :color="colorMap[key]"
          @select="select"
          @shift-select="shiftSelect"
          @down-control="downControl"
        />
      </g>
    </g>
    <g>
      <g
        v-for="(
          map, targetId
        ) in keyframePointsMapByTargetIdFilteredFocused.trueMap"
        :key="targetId"
      >
        <GraphKeyPoints
          v-for="(keyFrames, key) in map.props"
          :key="key"
          :point-key="key"
          :keyframes="getKeyframes(targetId, key)"
          :selected-state-map="selectedKeyframeMap"
          :color="colorMap[key]"
          focused
          @select="select"
          @shift-select="shiftSelect"
          @down-control="downControl"
        />
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, watch } from 'vue'
import { IdMap, toMap } from '/@/models'
import {
  CurveSelectedState,
  KeyframeBase,
  KeyframeBaseProps,
  KeyframeName,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import { getKeyframeMapByTargetId } from '/@/utils/animations'
import GraphKeyPoints from '/@/components/elements/molecules/GraphKeyPoints.vue'
import { getKeyframePropsMap, splitKeyframeProps } from '/@/utils/keyframes'
import { flatKeyListMap, getFirstProp } from '/@/utils/commons'
import { useKeysCache } from '/@/composables/cache'
import { TargetPropsState } from '/@/composables/stores/targetProps'

export default defineComponent({
  components: {
    GraphKeyPoints,
  },
  props: {
    keyframeMapByFrame: {
      type: Object as PropType<IdMap<KeyframeBase[]>>,
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
    propsStateMap: {
      type: Object as PropType<IdMap<TargetPropsState>>,
      default: () => ({}),
    },
  },
  emits: ['select', 'shift-select', 'down-control'],
  setup(props, { emit }) {
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
        const list = keyframeMapByTargetId.value[c]
        p[c] = getKeyframePropsMap(
          list,
          getFirstProp(list, 'name', 'bone' as KeyframeName)
        )
        p[c].props = Object.keys(p[c].props).reduce<{
          [key: string]: KeyframeBase[]
        }>((props, key) => {
          if (p[c].props[key].length > 0) props[key] = p[c].props[key]
          return props
        }, {})
        return p
      }, {})
    })

    const keyframePointsMapByTargetIdFilteredFocused = computed(() => {
      return splitKeyframeProps(
        keyframePointsMapByTargetId.value,
        isFocusedProp
      )
    })

    function isFocusedProp(targetId: string, key: string): boolean {
      return props.propsStateMap[targetId]?.props[key] === 'selected'
    }

    function select(keyframeId: string, state: KeyframeSelectedState) {
      emit('select', keyframeId, state)
    }
    function shiftSelect(keyframeId: string, state: KeyframeSelectedState) {
      emit('shift-select', keyframeId, state)
    }

    function downControl(
      keyframeId: string,
      pointKey: string,
      state: CurveSelectedState
    ) {
      emit('down-control', keyframeId, pointKey, state)
    }

    // Cache unselected keyframes
    // => These keyframes are needless to update and improve performance to rendering.
    const keyframePointsMapByTargetIdCache = useKeysCache(
      () => toMap(flatKeyListMap(props.keyframeMapByFrame)),
      keyframePointsMapByTargetId
    )
    watch(
      () => props.selectedKeyframeMap,
      keyframePointsMapByTargetIdCache.updateCache
    )

    function isSelected(targetId: string, key: string): boolean {
      return keyframePointsMapByTargetId.value[targetId].props[key].some(
        (k) => props.selectedKeyframeMap[k.id]?.props[key]
      )
    }
    function getKeyframes(targetId: string, key: string): KeyframeBase[] {
      if (isSelected(targetId, key)) {
        return keyframePointsMapByTargetId.value[targetId].props[key]
      }

      const list =
        keyframePointsMapByTargetIdCache.cache.value?.[targetId]?.props[key]

      if (!list) {
        console.warn(
          `Invalid cache for id: ${targetId} key: ${key}: Fallback to original data.`
        )
        return keyframePointsMapByTargetId.value![targetId].props[key]
      }

      return list
    }

    return {
      keyframePointsMapByTargetId,
      keyframePointsMapByTargetIdFilteredFocused,
      select,
      shiftSelect,
      downControl,
      getKeyframes,
      isFocusedProp,
    }
  },
})
</script>
