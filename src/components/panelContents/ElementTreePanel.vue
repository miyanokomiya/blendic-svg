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
import { useElementStore } from '/@/store/element'
import { getTreeFromElementNode } from '/@/utils/elements'
import { provideTreeContext } from '/@/composables/treeContext'

const elementStore = useElementStore()
</script>

<script setup lang="ts">
import TreeNode from '/@/components/atoms/TreeNode.vue'
import TreeContainer from '/@/components/atoms/TreeContainer.vue'

const treeRoot = computed(() => {
  const targetActor = elementStore.lastSelectedActor.value
  if (!targetActor) return
  return getTreeFromElementNode(targetActor.svgTree)
})

const lastselectedId = computed(() => {
  return elementStore.lastSelectedElementId.value
})

provideTreeContext({
  onClickElement: elementStore.selectElement,
  getSelectedMap: () => elementStore.selectedElements.value,
})
</script>
