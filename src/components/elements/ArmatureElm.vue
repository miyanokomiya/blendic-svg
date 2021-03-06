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
  <g stroke="black" :transform="transform" :opacity="opacity">
    <BoneElm
      v-for="bone in armature.bones"
      :key="bone.name"
      :bone="bone"
      :selected-state="boneSelectedState"
      :parent="boneMap[bone.parentId]"
      :scale="scale"
      @select="click"
      @shift-select="shiftClick"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { Armature, toMap } from '/@/models/index'
import { getTnansformStr } from '/@/utils/helpers'
import BoneElm from '/@/components/elements/Bone.vue'

export default defineComponent({
  components: { BoneElm },
  props: {
    armature: {
      type: Object as PropType<Armature>,
      required: true,
    },
    opacity: { type: Number, default: 0.8 },
    scale: { type: Number, default: 1 },
    selected: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['select', 'shift-select'],
  setup(props, { emit }) {
    return {
      boneMap: computed(() => toMap(props.armature.bones)),
      transform: computed(() => getTnansformStr(props.armature.transform)),
      boneSelectedState: computed(() =>
        props.selected ? { head: true, tail: true } : undefined
      ),
      click: () => emit('select', !props.selected),
      shiftClick: () => emit('shift-select', !props.selected),
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
