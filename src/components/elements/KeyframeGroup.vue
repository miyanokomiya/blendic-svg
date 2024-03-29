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
      <line x1="-100000" x2="100000" class="stroke-text" />
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
          data-type="keyframes-by-frame"
          :data-id="f"
          :cy="height"
          r="5"
          stroke="#000"
          :fill="selectedFrameMap[f] ? selectedColor : '#fff'"
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
            />
          </g>
        </g>
      </g>
    </g>
  </g>
</template>

<script lang="ts" setup>
import KeyPointGroup from '/@/components/elements/molecules/KeyPointGroup.vue'
import { computed } from 'vue'
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

const props = withDefaults(
  defineProps<{
    scale?: number
    keyframeMapByFrame?: IdMap<KeyframeBase[]>
    targetList?: KeyframeTargetSummary[]
    selectedKeyframeMap?: IdMap<KeyframeSelectedState>
    scrollY?: number
    height?: number
    targetExpandedMap?: IdMap<boolean>
    targetTopMap?: IdMap<number>
  }>(),
  {
    scale: 1,
    keyframeMapByFrame: () => ({}),
    targetList: () => [],
    selectedKeyframeMap: () => ({}),
    scrollY: 0,
    height: 24,
    targetExpandedMap: () => ({}),
    targetTopMap: () => ({}),
  }
)

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
  return Object.keys(props.keyframeMapByFrame).reduce<IdMap<KeyframeBase[]>>(
    (p, frame) => {
      p[frame] = sortAndFilterKeyframesByTargetId(
        props.keyframeMapByFrame[frame]
      )
      return p
    },
    {}
  )
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
  const ret = mapReduce(map.props, (val) => (val * frameWidth) / props.scale)
  ret.all = Math.min(...Object.keys(ret).map((key) => ret[key]))
  return ret
}

const selectedFrameMap = computed(() => {
  return mapReduce(props.keyframeMapByFrame, (keyframes) => {
    return keyframes.some((keyframe) => props.selectedKeyframeMap[keyframe.id])
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

const selectedColor = settings.selectedColor
</script>
