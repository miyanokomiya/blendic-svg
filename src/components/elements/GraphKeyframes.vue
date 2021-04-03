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
        :keyframes="getKeyframes(targetId, key)"
        :selected-state-map="selectedKeyframeMap"
        :color="colorMap[key]"
        @select="select"
        @shift-select="shiftSelect"
        @down-control="downControl"
      />
    </g>
  </g>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeUpdate,
  PropType,
  ref,
  toRaw,
  watch,
} from 'vue'
import { IdMap } from '/@/models'
import {
  CurveSelectedState,
  KeyframeBase,
  KeyframeBaseProps,
  KeyframeBone,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import { getKeyframeMapByTargetId } from '/@/utils/animations'
import GraphKeyPoints from '/@/components/elements/molecules/GraphKeyPoints.vue'
import { getKeyframePropsMap, inversedSelectedState } from '/@/utils/keyframes'
import { flatKeyListMap } from '/@/utils/commons'

export default defineComponent({
  components: {
    GraphKeyPoints,
  },
  props: {
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
        p[c] = getKeyframePropsMap(keyframeMapByTargetId.value[c], 'bone')
        p[c].props = Object.keys(p[c].props).reduce<{
          [key: string]: KeyframeBase[]
        }>((props, key) => {
          if (p[c].props[key].length > 0) props[key] = p[c].props[key]
          return props
        }, {})
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

    function downControl(
      keyframeId: string,
      pointKey: string,
      state: CurveSelectedState
    ) {
      emit('down-control', keyframeId, pointKey, state)
    }

    // Cache unselected keyframes
    // => These keyframes are needless to update and improve performance to rendering.
    const cachedKeyframePointsMapByTargetId = ref<
      IdMap<KeyframeBaseProps<KeyframeBase[]>>
    >()
    watch(() => props.selectedKeyframeMap, updateCache, { immediate: true })

    let ids = ''
    onBeforeUpdate(() => {
      // watch only ids of keyframes
      const nextIds = flatKeyListMap(props.keyframeMapByFrame)
        .map((k) => k.id)
        .sort()
        .join(',')
      if (ids !== nextIds) {
        updateCache()
        ids = nextIds
      }
    })

    function updateCache() {
      cachedKeyframePointsMapByTargetId.value = toRaw(
        keyframePointsMapByTargetId.value
      )
    }

    function isSelected(targetId: string, key: string): boolean {
      return keyframePointsMapByTargetId.value[targetId].props[key].some(
        (k) => props.selectedKeyframeMap[k.id]?.props[key]
      )
    }
    function getKeyframes(targetId: string, key: string): KeyframeBase[] {
      return !isSelected(targetId, key) &&
        cachedKeyframePointsMapByTargetId.value
        ? cachedKeyframePointsMapByTargetId.value![targetId].props[key]
        : keyframePointsMapByTargetId.value[targetId].props[key]
    }

    return {
      keyframePointsMapByTargetId,
      cachedKeyframePointsMapByTargetId,
      select,
      shiftSelect,
      downControl,
      getKeyframes,
    }
  },
})
</script>
