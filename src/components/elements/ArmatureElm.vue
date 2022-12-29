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
  <g
    :transform="transform"
    :opacity="opacity"
    data-type="armature-body"
    :data-id="armature.id"
  >
    <BoneElm
      v-for="bone in sortedBoneMap"
      :key="bone.id"
      read-only
      :bone="bone"
      :selected-state="boneSelectedState"
      :parent="boneMap[bone.parentId]"
      :scale="scale"
      @select="click"
    />
  </g>
</template>

<script lang="ts" setup>
import BoneElm from '/@/components/elements/BoneElm.vue'
import { computed } from 'vue'
import { Armature, Bone, toMap } from '/@/models/index'
import { getTnansformStr } from '/@/utils/helpers'
import { sortBoneBySize } from '/@/utils/armatures'
import { injectScale } from '/@/composables/canvas'

const props = withDefaults(
  defineProps<{
    armature: Armature
    bones: Bone[]
    opacity?: number
    selected?: boolean
  }>(),
  {
    opacity: 0.8,
    selected: false,
  }
)

const emit = defineEmits<{
  (e: 'select'): void
}>()

const sortedBoneMap = computed(() => {
  return sortBoneBySize(props.bones)
})

const scale = computed(injectScale())

const boneMap = computed(() => toMap(props.bones))
const transform = computed(() => getTnansformStr(props.armature.transform))

const boneSelectedState = computed(() =>
  props.selected ? ({ head: true, tail: true } as const) : undefined
)

const click = () => emit('select')
</script>
