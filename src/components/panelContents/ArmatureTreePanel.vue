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

Copyright (C) 2022, Tomoya Komiyama.
-->

<template>
  <TreeContainer
    v-if="treeRoot"
    :scroll-target="lastselectedId"
    class="tree-view"
  >
    <TreeNode :node="treeRoot" />
  </TreeContainer>
</template>

<script lang="ts">
import { computed } from 'vue'
import { useStore } from '/@/store'
import { useCanvasStore } from '/@/store/canvas'
import { provideTreeContext } from '/@/composables/treeContext'
import { getTree } from '/@/utils/armatures'
import { SelectOptions } from '/@/composables/modes/types'
import { mapReduce } from '/@/utils/commons'

const store = useStore()
const canvasStore = useCanvasStore()
</script>

<script setup lang="ts">
import TreeNode from '/@/components/atoms/TreeNode.vue'
import TreeContainer from '/@/components/atoms/TreeContainer.vue'

const treeRoot = computed(() => {
  if (!store.lastSelectedArmature.value) return
  return {
    id: store.lastSelectedArmature.value.id,
    name: store.lastSelectedArmature.value.name,
    children: getTree(store.boneMap.value),
  }
})

const lastselectedId = computed(() => {
  return store.lastSelectedBoneId.value
})

function onClickElement(id: string, options?: SelectOptions) {
  if (!store.lastSelectedArmature.value) return

  if (id === store.lastSelectedArmature.value.id) {
    store.selectAllBones()
  } else {
    store.selectBone(
      id,
      { head: true, tail: true },
      options,
      canvasStore.canvasMode.value === 'pose'
    )
  }
}

function updateName(id: string, name: string) {
  if (!store.lastSelectedArmature.value) return

  if (id === store.lastSelectedArmature.value.id) {
    store.updateArmatureName(name)
  } else {
    store.updateBone({ name })
  }
}

provideTreeContext('armature', {
  onClickElement,
  getSelectedMap: () => mapReduce(store.selectedBones.value, () => true),
  getEditable: () => true,
  updateName,
})
</script>
