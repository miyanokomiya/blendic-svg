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
  <div class="file-panel">
    <h3>Element Tree</h3>
    <div v-if="treeRoot" class="tree-view">
      <TreeNode :node="treeRoot" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, provide } from 'vue'
import { useElementStore } from '/@/store/element'
import TreeNode from '/@/components/atoms/TreeNode.vue'
import { useCanvasStore } from '/@/store/canvas'
import { getTreeFromElementNode } from '/@/utils/elements'

export default defineComponent({
  components: { TreeNode },
  setup() {
    const elementStore = useElementStore()
    const canvasStore = useCanvasStore()

    const targetActor = computed(() => elementStore.lastSelectedActor.value)

    const treeRoot = computed(() => {
      if (!targetActor.value) return
      return getTreeFromElementNode(targetActor.value.svgTree)
    })

    const selectedMap = computed(() => {
      if (canvasStore.state.canvasMode !== 'weight') return {}
      return elementStore.selectedElements.value
    })

    function clickElement(id: string, shift: boolean) {
      if (canvasStore.state.canvasMode !== 'weight') return
      elementStore.selectElement(id, shift)
    }

    provide('onClickElement', clickElement)
    provide('selectedMap', selectedMap)

    return {
      treeRoot,
    }
  },
})
</script>

<style lang="scss" scoped>
h3 {
  margin-bottom: 10px;
  text-align: left;
}
</style>
