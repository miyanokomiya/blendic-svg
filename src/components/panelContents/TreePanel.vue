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
  <div>
    <h3>{{ treeType }}</h3>
    <ElementTreePanel v-if="mode === 'weight'" />
    <ArmatureTreePanel v-else />
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '/@/store/canvas'

const canvasStore = useCanvasStore()
</script>

<script setup lang="ts">
import ArmatureTreePanel from '/@/components/panelContents/ArmatureTreePanel.vue'
import ElementTreePanel from '/@/components/panelContents/ElementTreePanel.vue'

const mode = canvasStore.canvasMode

const treeType = computed(() => {
  switch (mode.value) {
    case 'weight':
      return 'Element Tree'
    default:
      return 'Armature Tree'
  }
})
</script>

<style scoped>
h3 {
  margin-bottom: 10px;
  text-align: left;
}
</style>
