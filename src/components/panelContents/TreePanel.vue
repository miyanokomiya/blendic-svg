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
    <ElementTreePanel v-if="mode === 'weight'" />
    <div v-else-if="treeRoot" ref="treeViewElm" class="tree-view">
      <TreeNode :node="treeRoot" />
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, provide, watch } from 'vue'
import { useCanvasStore } from '/@/store/canvas'
import { useStore } from '/@/store'
import { mapReduce } from '/@/utils/commons'
import { getTree } from '/@/utils/armatures'
import { SelectOptions } from '/@/composables/modes/types'

const canvasStore = useCanvasStore()
const store = useStore()
</script>

<script setup lang="ts">
import TreeNode from '/@/components/atoms/TreeNode.vue'
import ElementTreePanel from '/@/components/panelContents/ElementTreePanel.vue'

const mode = canvasStore.canvasMode

const treeType = computed(() => {
  switch (mode.value) {
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

const treeRoot = computed(() => {
  switch (mode.value) {
    case 'object':
    case 'edit':
    case 'pose':
      if (!store.lastSelectedArmature.value) return undefined
      return {
        id: store.lastSelectedArmature.value.id,
        name: store.lastSelectedArmature.value.name,
        children: getTree(store.boneMap.value),
      }
    default:
      return undefined
  }
})

const selectedMap = computed(() => {
  switch (mode.value) {
    case 'edit':
    case 'pose':
      return mapReduce(store.selectedBones.value, () => true)
    default:
      return {}
  }
})

const lastselectedId = computed(() => {
  switch (mode.value) {
    case 'object':
      return store.lastSelectedArmatureId.value
    case 'edit':
    case 'pose':
      return store.lastSelectedBoneId.value
    default:
      return undefined
  }
})

const treeViewElm = ref<HTMLElement>()
watch(lastselectedId, (to) => {
  if (to && treeViewElm.value) {
    treeViewElm.value
      .querySelector(`[data-scroll_anchor="${to}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})

function clickElement(id: string, options?: SelectOptions) {
  switch (mode.value) {
    case 'edit':
    case 'pose':
      if (!store.lastSelectedArmature.value) return

      if (id === store.lastSelectedArmature.value.id) {
        store.selectAllBones()
      } else {
        store.selectBone(
          id,
          { head: true, tail: true },
          options,
          mode.value === 'pose'
        )
      }
      return
    default:
      return
  }
}

function updateName(id: string, name: string) {
  if (!name) return

  switch (mode.value) {
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
provide('getSelectedMap', () => selectedMap.value)
provide('updateName', updateName)
provide('getEditable', () => mode.value !== 'weight')
</script>

<style scoped>
h3 {
  margin-bottom: 10px;
  text-align: left;
}
</style>
