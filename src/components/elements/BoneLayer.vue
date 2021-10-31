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
    <BoneElm
      v-for="bone in sortedBoneMap"
      :key="bone.id"
      :bone="bone"
      :parent="boneMap[bone.parentId]"
      :selected-state="selectedBones[bone.id]"
      :scale="scale"
      :pose-mode="canvasMode === 'pose'"
      :class="{ 'view-only': canvasMode === 'weight' }"
      @select="(state, options) => selectBone(bone.id, state, options)"
    />
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { Bone, BoneSelectedState, IdMap } from '/@/models'
import BoneElm from '/@/components/elements/BoneElm.vue'
import { CanvasMode, SelectOptions } from '/@/composables/modes/types'
import { sortBoneBySize } from '/@/utils/armatures'
import { toList } from '/@/utils/commons'
import { injectScale } from '/@/composables/canvas'

export default defineComponent({
  components: { BoneElm },
  props: {
    boneMap: {
      type: Object as PropType<IdMap<Bone>>,
      default: () => ({}),
    },
    selectedBones: {
      type: Object as PropType<IdMap<BoneSelectedState>>,
      default: () => ({}),
    },
    canvasMode: {
      type: String as PropType<CanvasMode>,
      default: 'object',
    },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const sortedBoneMap = computed(() => {
      return sortBoneBySize(toList(props.boneMap))
    })

    const scale = computed(injectScale())

    return {
      scale,
      sortedBoneMap,
      selectBone(
        boneId: string,
        state: BoneSelectedState,
        options?: SelectOptions
      ) {
        emit('select', boneId, state, options)
      },
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
