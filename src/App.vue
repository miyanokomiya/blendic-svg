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
  <ResizableV :initial-rate="0.7" storage-key="app-v" class="app-root">
    <template #top>
      <ResizableH
        :initial-rate="0.8"
        storage-key="app-panel-h"
        dense
        class="top"
      >
        <template #left>
          <ResizableH
            :initial-rate="0.1"
            storage-key="app-canvas-h"
            dense
            class="main-wrapper"
          >
            <template #left>
              <AnimationGraphPanel class="animation-graph" />
            </template>
            <template #right>
              <div class="main">
                <AppCanvas :original-view-box="viewBox" class="canvas">
                  <ElementLayer
                    :bone-map="posedBoneMap"
                    :canvas-mode="canvasMode"
                    :class="{ 'view-only': canvasMode !== 'weight' }"
                  />
                  <g v-if="canvasMode === 'object'">
                    <ArmatureElm
                      v-for="armature in armatures"
                      :key="armature.id"
                      :armature="armature"
                      :bones="bonesByArmatureId[armature.id]"
                      :selected="lastSelectedArmatureId === armature.id"
                    />
                  </g>
                  <g v-else>
                    <ArmatureElm
                      v-for="armature in otherArmatures"
                      :key="armature.id"
                      :armature="armature"
                      :bones="bonesByArmatureId[armature.id]"
                      :opacity="0.3"
                      class="view-only"
                    />
                    <BoneLayer
                      :bone-map="visibledBoneMap"
                      :selected-bones="selectedBones"
                      :canvas-mode="canvasMode"
                    />
                    <SpaceAxis
                      v-if="lastSelectedBoneSpace"
                      :origin="lastSelectedBoneSpace.origin"
                      :radian="lastSelectedBoneSpace.radian"
                      class="view-only"
                    />
                  </g>
                </AppCanvas>
                <CanvasSideBar class="side-bar" />
              </div>
            </template>
          </ResizableH>
        </template>
        <template #right>
          <ResizableV
            :initial-rate="0.4"
            storage-key="app-side"
            dense
            class="side-panel"
          >
            <template #top>
              <SidePanel />
            </template>
            <template #bottom>
              <SidePanel initial-tab="detail" />
            </template>
          </ResizableV>
        </template>
      </ResizableH>
    </template>
    <template #bottom>
      <div class="bottom">
        <AnimationPanel />
      </div>
    </template>
  </ResizableV>
</template>

<script lang="ts">
import { computed } from 'vue'
import { useStore } from '/@/store/index'
import { useCanvasStore } from './store/canvas'
import { useHistoryStore } from './store/history'
import { useAnimationStore } from './store/animation'
import { useStorage } from './composables/storage'
import { useElementStore } from './store/element'
import { isCtrlOrMeta } from '/@/utils/devices'
import { useGlobalKeydown } from '/@/composables/window'

const store = useStore()
const canvasStore = useCanvasStore()
const animationStore = useAnimationStore()
const historyStore = useHistoryStore()
const elementStore = useElementStore()
const storage = useStorage()

store.createDefaultEntities()
elementStore.createDefaultEntities()

function onGlobalKeyDown(e: KeyboardEvent) {
  if (
    ['input', 'textarea'].includes((e.target as Element)?.tagName.toLowerCase())
  )
    return

  if (isCtrlOrMeta(e) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) {
      historyStore.redo()
    } else {
      historyStore.undo()
    }
  } else if (e.key.toLowerCase() === ' ') {
    e.preventDefault()
    animationStore.togglePlaying()
  } else if (isCtrlOrMeta(e) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    storage.overrideProjectFile()
  } else if (isCtrlOrMeta(e) && e.key.toLowerCase() === 'o') {
    e.preventDefault()
    if (e.shiftKey) {
      storage.loadSvgFile()
    } else {
      storage.loadProjectFile()
    }
  }
}
</script>

<script setup lang="ts">
import AppCanvas from './components/AppCanvas.vue'
import SidePanel from './components/SidePanel.vue'
import AnimationGraphPanel from './components/AnimationGraphPanel.vue'
import AnimationPanel from './components/AnimationPanel.vue'
import ElementLayer from './components/elements/ElementLayer.vue'
import ArmatureElm from './components/elements/ArmatureElm.vue'
import CanvasSideBar from '/@/components/CanvasSideBar.vue'
import BoneLayer from '/@/components/elements/BoneLayer.vue'
import SpaceAxis from '/@/components/elements/atoms/SpaceAxis.vue'
import ResizableV from '/@/components/atoms/ResizableV.vue'
import ResizableH from '/@/components/atoms/ResizableH.vue'

useGlobalKeydown(onGlobalKeyDown)

const viewBox = computed(() => {
  return elementStore.lastSelectedActor.value?.viewBox
})

const canvasMode = canvasStore.canvasMode

const armatures = store.armatures
const otherArmatures = computed(() =>
  armatures.value.filter((a) => a.id !== store.lastSelectedArmature.value?.id)
)

const posedBoneMap = canvasStore.posedBoneMap
const visibledBoneMap = canvasStore.visibledBoneMap
const lastSelectedBoneSpace = canvasStore.lastSelectedBoneSpace

const selectedBones = computed(() => {
  if (canvasMode.value === 'weight') {
    // hilight parent bone for weight paiting
    const selectedElement = elementStore.lastSelectedElement.value
    return selectedElement?.boneId
      ? { [selectedElement.boneId]: { head: true, tail: true } as const }
      : {}
  } else {
    return store.selectedBones.value
  }
})

const lastSelectedArmatureId = computed(
  () => store.lastSelectedArmature.value?.id
)
const bonesByArmatureId = store.bonesByArmatureId
</script>

<style scoped>
.app-root {
  height: 100vh;
}
.top {
  height: 100%;
}
.main-wrapper {
  height: 100%;
}
.animation-graph {
  height: 100%;
}
.main {
  height: 100%;
  display: flex;
  background-color: var(--background);
}
.main .canvas {
  width: calc(100% - 24px);
}
.main .side-bar {
  flex-shrink: 0;
}
.side-panel {
  height: 100%;
}
.bottom {
  height: 100%;
}
</style>
