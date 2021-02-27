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
      <TimelineRow
        v-for="(bone, i) in selectedAllBoneList"
        :key="bone.id"
        :index="i + 2"
        :label-width="labelWidth"
        :label="bone.name"
      />
    </g>
    <TimelineRow :index="0" :label-width="labelWidth" label="" />
    <TimelineRow :index="1" :label-width="labelWidth" label="Summary" />
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Bone } from '/@/models'
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
    scrollY: {
      type: Number,
      default: 0,
    },
  },
})
</script>
