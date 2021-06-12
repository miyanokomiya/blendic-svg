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
    <h3>{{ treeType }}</h3>
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
import { useStore } from '/@/store'
import { mapReduce } from '/@/utils/commons'
import { getTree } from '/@/utils/armatures'
import { SelectOptions } from '/@/composables/modes/types'

export default defineComponent({
  components: { TreeNode },
  setup() {
    const elementStore = useElementStore()
    const canvasStore = useCanvasStore()
    const store = useStore()

    const treeType = computed(() => {
      switch (canvasStore.state.canvasMode) {
        case 'object':
        case 'edit':
        case 'pose':
          return 'Armature Tree'
        case 'weight':
          return 'Element Tree'
        default:
          return ''
      }
    })

    const targetActor = computed(() => {
      return elementStore.lastSelectedActor.value
    })

    const treeRoot = computed(() => {
      switch (canvasStore.state.canvasMode) {
        case 'object':
        case 'edit':
        case 'pose':
          if (!store.lastSelectedArmature.value) return undefined
          return {
            id: store.lastSelectedArmature.value.id,
            name: store.lastSelectedArmature.value.name,
            children: getTree(store.boneMap.value),
          }
        case 'weight':
          if (!targetActor.value) return
          return getTreeFromElementNode(targetActor.value.svgTree)
        default:
          return undefined
      }
    })

    const selectedMap = computed(() => {
      switch (canvasStore.state.canvasMode) {
        case 'edit':
        case 'pose':
          return mapReduce(store.allSelectedBones.value, () => true)
        case 'weight':
          return elementStore.selectedElements.value
        default:
          return {}
      }
    })

    function clickElement(id: string, options?: SelectOptions) {
      switch (canvasStore.state.canvasMode) {
        case 'edit':
        case 'pose':
          if (!store.lastSelectedArmature.value) return

          if (id === store.lastSelectedArmature.value.id) {
            store.selectAllBone()
          } else {
            store.selectBone(
              id,
              { head: true, tail: true },
              options,
              canvasStore.state.canvasMode === 'pose'
            )
          }
          return
        case 'weight':
          elementStore.selectElement(id, options)
          return
        default:
          return
      }
    }

    function updateName(id: string, name: string) {
      if (!name) return

      switch (canvasStore.state.canvasMode) {
        case 'object':
        case 'edit':
        case 'pose':
          if (!store.lastSelectedArmature.value) return

          if (id === store.lastSelectedArmature.value.id) {
            store.updateArmatureName(name)
          } else {
            store.updateBone({ name })
          }
          return
        default:
          return
      }
    }

    provide('onClickElement', clickElement)
    provide('selectedMap', selectedMap)
    provide('updateName', updateName)
    provide('getEditable', () => canvasStore.state.canvasMode !== 'weight')

    return {
      treeType,
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
