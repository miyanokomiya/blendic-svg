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
    <g :transform="`scale(${scale}) translate(0, ${headerHeight * 2})`">
      <line x1="-100000" x2="100000" stroke="#000" />
    </g>
    <g
      v-for="(keyframes, f) in sortedKeyframeMapByFrame"
      :key="f"
      :transform="`translate(${parseInt(f) * frameWidth}, 0)`"
    >
      <g :transform="`scale(${scale}) translate(0, 36)`">
        <circle
          v-if="keyframes.length > 0"
          key="all"
          r="5"
          stroke="#000"
          :fill="selectedFrameMap[f] ? selectedColor : '#fff'"
          @click.left.exact="selectFrame(f)"
          @click.left.shift.exact="shiftSelectFrame(f)"
        />
        <g :transform="`translate(0, ${-scrollY})`">
          <g v-for="k in keyframes" :key="k.id">
            <template v-if="boneRowMap[k.boneId] > scrollY + headerHeight / 2">
              <rect
                :y="boneRowMap[k.boneId] - 3"
                :width="
                  (getSameRangeFrame(k.boneId, k.frame) * frameWidth) / scale
                "
                height="6"
                fill="#aaa"
                fill-opacity="0.5"
                class="view-only"
              />
              <circle
                :cy="boneRowMap[k.boneId]"
                r="5"
                stroke="#000"
                :fill="selectedKeyframeMap[k.id] ? selectedColor : '#fff'"
                @click.left.exact="select(k.id)"
                @click.left.shift.exact="shiftSelect(k.id)"
              />
            </template>
          </g>
        </g>
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useSettings } from '/@/composables/settings'
import { IdMap, Keyframe, frameWidth } from '/@/models'
import {
  getKeyframeMapByBoneId,
  getSameRangeFrameMapByBoneId,
} from '/@/utils/animations'
import { mapReduce } from '/@/utils/commons'

export default defineComponent({
  props: {
    scale: {
      type: Number,
      default: 1,
    },
    keyframeMapByFrame: {
      type: Object as PropType<IdMap<Keyframe[]>>,
      default: () => ({}),
    },
    boneIds: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    selectedKeyframeMap: {
      type: Object as PropType<IdMap<boolean>>,
      default: () => ({}),
    },
    scrollY: {
      type: Number,
      default: 0,
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
      return Object.keys(props.keyframeMapByFrame).reduce<IdMap<Keyframe[]>>(
        (p, frame) => {
          p[frame] = sortAndFilterKeyframesByBoneId(
            props.keyframeMapByFrame[frame]
          )
          return p
        },
        {}
      )
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
      return mapReduce(boneIndexMap.value, (index) => (index + 1) * 24)
    })

    function sortAndFilterKeyframesByBoneId(keyframes: Keyframe[]): Keyframe[] {
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
      headerHeight: 24,
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
