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
        v-for="bone in selectedAllBoneList"
        :key="bone.id"
        :transform="`translate(0, ${boneTopMap[bone.id]})`"
      >
        <TimelineRow
          :label-width="labelWidth"
          :label-height="height"
          :label="bone.name"
          :expanded="boneExpandedMap[bone.id]"
          show-expanded
          @toggle-expanded="toggleBoneExpanded(bone.id)"
        />
        <g v-if="boneExpandedMap[bone.id]">
          <TimelineRow
            :transform="`translate(10, ${height})`"
            :label-width="labelWidth - 10"
            :label-height="height"
            label="Location"
          />
          <TimelineRow
            :transform="`translate(10, ${2 * height})`"
            :label-width="labelWidth - 10"
            :label-height="height"
            label="Rotation"
          />
          <TimelineRow
            :transform="`translate(10, ${3 * height})`"
            :label-width="labelWidth - 10"
            :label-height="height"
            label="Scale"
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
import { defineComponent, PropType } from 'vue'
import { Bone, IdMap } from '/@/models'
import TimelineRow from './atoms/TimelineRow.vue'

export default defineComponent({
  components: {
    TimelineRow,
  },
  props: {
    selectedAllBoneList: {
      type: Array as PropType<Bone[]>,
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
    boneExpandedMap: {
      type: Object as PropType<IdMap<boolean>>,
      default: () => ({}),
    },
    boneTopMap: {
      type: Object as PropType<IdMap<number>>,
      default: () => [],
    },
  },
  emits: ['toggle-bone-expanded'],
  setup(props, { emit }) {
    function toggleBoneExpanded(boneId: string) {
      emit('toggle-bone-expanded', boneId)
    }

    return {
      toggleBoneExpanded,
    }
  },
})
</script>
