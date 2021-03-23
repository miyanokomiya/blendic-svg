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
      :transform="`translate(${parseInt(f) * frameWidth}, 0)`"
    >
      <g :transform="`scale(${scale}) translate(0, ${height / 2})`">
        <circle
          v-if="keyframes.length > 0"
          key="all"
          :cy="height"
          r="5"
          stroke="#000"
          :fill="selectedFrameMap[f] ? selectedColor : '#fff'"
          @click.left.exact="selectFrame(f)"
          @click.left.shift.exact="shiftSelectFrame(f)"
        />
        <g :transform="`translate(0, ${-scrollY})`">
          <g v-for="k in keyframes" :key="k.id">
            <KeyPointTransform
              :key-frame="k"
              :top="boneTopMap[k.boneId]"
              :selected-state="selectedKeyframeMap[k.id]"
              :expanded="boneExpandedMap[k.boneId]"
              :same-range-width="
                (getSameRangeFrame(k.boneId, k.frame) * frameWidth) / scale
              "
              :height="height"
              :scroll-y="scrollY"
              @select="select(k.id)"
              @shift-select="shiftSelect(k.id)"
            />
          </g>
        </g>
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import KeyPointTransform from '/@/components/elements/molecules/KeyPointTransform.vue'
import { useSettings } from '/@/composables/settings'
import { IdMap, frameWidth } from '/@/models'
import { KeyframeBone, KeyframeSelectedState } from '/@/models/keyframe'
import {
  getKeyframeMapByBoneId,
  getSameRangeFrameMapByBoneId,
} from '/@/utils/animations'
import { mapReduce } from '/@/utils/commons'

export default defineComponent({
  components: { KeyPointTransform },
  props: {
    scale: {
      type: Number,
      default: 1,
    },
    keyframeMapByFrame: {
      type: Object as PropType<IdMap<KeyframeBone[]>>,
      default: () => ({}),
    },
    boneIds: {
      type: Array as PropType<string[]>,
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
    boneExpandedMap: {
      type: Object as PropType<IdMap<boolean>>,
      default: () => ({}),
    },
    boneTopMap: {
      type: Object as PropType<IdMap<number>>,
      default: () => [],
    },
  },
  emits: ['select', 'shift-select', 'select-frame', 'shift-select-frame'],
  setup(props, { emit }) {
    const { settings } = useSettings()

    const boneIndexMap = computed(
      (): IdMap<number> => {
        return props.boneIds.reduce<IdMap<number>>((p, id, i) => {
          p[id] = i
          return p
        }, {})
      }
    )

    const sortedKeyframeMapByFrame = computed(() => {
      return Object.keys(props.keyframeMapByFrame).reduce<
        IdMap<KeyframeBone[]>
      >((p, frame) => {
        p[frame] = sortAndFilterKeyframesByBoneId(
          props.keyframeMapByFrame[frame]
        )
        return p
      }, {})
    })

    const keyframeMapByBoneId = computed(() => {
      return getKeyframeMapByBoneId(
        Object.keys(props.keyframeMapByFrame).flatMap((frame) => {
          return props.keyframeMapByFrame[frame]
        })
      )
    })

    const sameRangeFrameMapByBoneId = computed(() => {
      return getSameRangeFrameMapByBoneId(keyframeMapByBoneId.value)
    })

    function getSameRangeFrame(boneId: string, frame: number): number {
      return sameRangeFrameMapByBoneId.value[boneId]?.[frame] ?? 0
    }

    const selectedFrameMap = computed(() => {
      return mapReduce(props.keyframeMapByFrame, (keyframes) => {
        return keyframes.some(
          (keyframe) => props.selectedKeyframeMap[keyframe.id]
        )
      })
    })

    const boneRowMap = computed(() => {
      return mapReduce(
        boneIndexMap.value,
        (index) => (index + 1) * props.height
      )
    })

    function sortAndFilterKeyframesByBoneId(
      keyframes: KeyframeBone[]
    ): KeyframeBone[] {
      return keyframes
        .filter((k) => boneIndexMap.value[k.boneId] > -1)
        .sort(
          (a, b) => boneIndexMap.value[a.boneId] - boneIndexMap.value[b.boneId]
        )
    }

    function select(keyframeId: string) {
      emit('select', keyframeId)
    }
    function shiftSelect(keyframeId: string) {
      emit('shift-select', keyframeId)
    }
    function selectFrame(keyframeId: string) {
      emit('select-frame', keyframeId)
    }
    function shiftSelectFrame(keyframeId: string) {
      emit('shift-select-frame', keyframeId)
    }

    return {
      frameWidth,
      boneIndexMap,
      sortedKeyframeMapByFrame,
      getSameRangeFrame,
      selectedFrameMap,
      select,
      shiftSelect,
      selectFrame,
      shiftSelectFrame,
      selectedColor: settings.selectedColor,
      boneRowMap,
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
