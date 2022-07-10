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
    <g :transform="`scale(${scale}) translate(0, ${height * 2})`">
      <line x1="-100000" x2="100000" stroke="#000" />
    </g>
    <g
      v-for="(keyframes, f) in sortedKeyframeMapByFrame"
      :key="f"
      :transform="`translate(${parseInt(f as string) * frameWidth}, 0)`"
    >
      <g :transform="`scale(${scale}) translate(0, ${height / 2})`">
        <circle
          v-if="keyframes.length > 0"
          key="all"
          :cy="height"
          r="5"
          stroke="#000"
          :fill="selectedFrameMap[f] ? selectedColor : '#fff'"
          @click.left.exact="selectFrame(f as string)"
          @click.left.shift.exact="shiftSelectFrame(f as string)"
        />
        <g :transform="`translate(0, ${-scrollY})`">
          <g v-for="k in keyframes" :key="k.id">
            <KeyPointGroup
              :key-frame="k"
              :child-map="targetMap[k.targetId].children"
              :top="targetTopMap[k.targetId]"
              :selected-state="selectedKeyframeMap[k.id]"
              :expanded="targetExpandedMap[k.targetId]"
              :same-range-width="getSameRangeFrame(k.targetId, k.frame)"
              :height="height"
              :scroll-y="scrollY"
              @select="(state) => select(k.id, state)"
              @shift-select="(state) => shiftSelect(k.id, state)"
            />
          </g>
        </g>
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import KeyPointGroup from '/@/components/elements/molecules/KeyPointGroup.vue'
import { useSettings } from '/@/composables/settings'
import { IdMap, frameWidth, toMap } from '/@/models'
import {
  KeyframeBase,
  KeyframeBaseSameRange,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import { getKeyframeMapByTargetId } from '/@/utils/animations'
import { mapReduce } from '/@/utils/commons'
import { KeyframeTargetSummary } from '/@/utils/helpers'
import { getSamePropRangeFrameMapById } from '/@/utils/keyframes'

export default defineComponent({
  components: { KeyPointGroup },
  props: {
    scale: {
      type: Number,
      default: 1,
    },
    keyframeMapByFrame: {
      type: Object as PropType<IdMap<KeyframeBase[]>>,
      default: () => ({}),
    },
    targetList: {
      type: Array as PropType<KeyframeTargetSummary[]>,
      default: () => [],
    },
    selectedKeyframeMap: {
      type: Object as PropType<IdMap<KeyframeSelectedState>>,
      default: () => ({}),
    },
    scrollY: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 24,
    },
    targetExpandedMap: {
      type: Object as PropType<IdMap<boolean>>,
      default: () => ({}),
    },
    targetTopMap: {
      type: Object as PropType<IdMap<number>>,
      default: () => ({}),
    },
  },
  emits: ['select', 'shift-select', 'select-frame', 'shift-select-frame'],
  setup(props, { emit }) {
    const { settings } = useSettings()

    const targetIds = computed(() => props.targetList.map((t) => t.id))

    const targetIndexMap = computed((): IdMap<number> => {
      return targetIds.value.reduce<IdMap<number>>((p, id, i) => {
        p[id] = i
        return p
      }, {})
    })

    const indexMap = computed(() => {
      return targetIndexMap.value
    })

    const sortedKeyframeMapByFrame = computed(() => {
      return Object.keys(props.keyframeMapByFrame).reduce<
        IdMap<KeyframeBase[]>
      >((p, frame) => {
        p[frame] = sortAndFilterKeyframesByTargetId(
          props.keyframeMapByFrame[frame]
        )
        return p
      }, {})
    })

    const keyframeMapByTargetId = computed(() => {
      return getKeyframeMapByTargetId(
        Object.keys(props.keyframeMapByFrame).flatMap((frame) => {
          return props.keyframeMapByFrame[frame]
        })
      )
    })

    const sameRangeFrameMapByTargetId = computed(() => {
      return getSamePropRangeFrameMapById(keyframeMapByTargetId.value)
    })

    function getSameRangeFrame(
      targetId: string,
      frame: number
    ): KeyframeBaseSameRange['props'] | undefined {
      const map = sameRangeFrameMapByTargetId.value[targetId]?.[frame]
      if (!map) return
      const ret = mapReduce(
        map.props,
        (val) => (val * frameWidth) / props.scale
      )
      ret.all = Math.min(...Object.keys(ret).map((key) => ret[key]))
      return ret
    }

    const selectedFrameMap = computed(() => {
      return mapReduce(props.keyframeMapByFrame, (keyframes) => {
        return keyframes.some(
          (keyframe) => props.selectedKeyframeMap[keyframe.id]
        )
      })
    })

    const targetMap = computed(() => {
      return toMap(props.targetList)
    })

    function sortAndFilterKeyframesByTargetId(
      keyframes: KeyframeBase[]
    ): KeyframeBase[] {
      return keyframes
        .filter((k) => indexMap.value[k.targetId] > -1)
        .sort((a, b) => indexMap.value[a.targetId] - indexMap.value[b.targetId])
    }

    function select(keyframeId: string, state: KeyframeSelectedState) {
      emit('select', keyframeId, state)
    }
    function shiftSelect(keyframeId: string, state: KeyframeSelectedState) {
      emit('shift-select', keyframeId, state)
    }
    function selectFrame(keyframeId: string) {
      emit('select-frame', keyframeId)
    }
    function shiftSelectFrame(keyframeId: string) {
      emit('shift-select-frame', keyframeId)
    }

    return {
      frameWidth,
      sortedKeyframeMapByFrame,
      targetMap,
      getSameRangeFrame,
      selectedFrameMap,
      select,
      shiftSelect,
      selectFrame,
      shiftSelectFrame,
      selectedColor: settings.selectedColor,
    }
  },
})
</script>
