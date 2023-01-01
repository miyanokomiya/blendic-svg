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
  <div class="weight-panel">
    <h4>Weight Paint</h4>
    <form v-if="canvasMode === 'weight' && targetActor" @submit.prevent>
      <template v-if="targetElement">
        <template v-if="targetElement.tag === 'svg'">
          <BlockField label="Viewbox">
            <SelectWithPicker
              v-model="viewBoxBoneId"
              name="viewBoxBoneId"
              :options="boneOptions"
              @start-pick="startPickBone"
            />
          </BlockField>
        </template>
        <template v-else>
          <BlockField label="Transform">
            <SelectWithPicker
              v-model="boneId"
              name="boneId"
              :options="boneOptions"
              @start-pick="startPickBone"
            />
          </BlockField>
          <BlockField label="Fill">
            <SelectWithPicker
              v-model="fillBoneId"
              name="fillBoneId"
              :options="boneOptions"
              @start-pick="startPickBone"
            />
          </BlockField>
          <BlockField label="Stroke">
            <SelectWithPicker
              v-model="strokeBoneId"
              name="strokeBoneId"
              :options="boneOptions"
              @start-pick="startPickBone"
            />
          </BlockField>
        </template>
      </template>
    </form>
    <div v-else>
      <p>No Item</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BlockField from '/@/components/atoms/BlockField.vue'
import SelectWithPicker from '/@/components/molecules/SelectWithPicker.vue'
import { computed } from 'vue'
import { useStore } from '/@/store'
import { useCanvasStore } from '/@/store/canvas'
import { useElementStore } from '/@/store/element'
import { sortByValue } from '/@/utils/commons'
import { PickerOptions } from '/@/composables/modes/types'

const store = useStore()
const canvasStore = useCanvasStore()
const elementStore = useElementStore()

const canvasMode = canvasStore.canvasMode

const targetActor = computed(() => {
  return elementStore.lastSelectedActor.value
})

const targetElement = computed(() => {
  return elementStore.lastSelectedElement.value
})

const currentArmature = computed(() => {
  return store.armatures.value.find(
    (a) => a.id === elementStore.lastSelectedActor.value?.armatureId
  )
})

const boneId = computed({
  get(): string {
    return targetElement.value?.boneId ?? ''
  },
  set(val: string) {
    elementStore.updateElement({ boneId: val })
  },
})
const fillBoneId = computed({
  get(): string {
    return targetElement.value?.fillBoneId ?? ''
  },
  set(val: string) {
    elementStore.updateElement({ fillBoneId: val })
  },
})
const strokeBoneId = computed({
  get(): string {
    return targetElement.value?.strokeBoneId ?? ''
  },
  set(val: string) {
    elementStore.updateElement({ strokeBoneId: val })
  },
})

const viewBoxBoneId = computed({
  get(): string {
    return targetElement.value?.viewBoxBoneId ?? ''
  },
  set(val: string) {
    elementStore.updateElement({ viewBoxBoneId: val })
  },
})

const boneOptions = computed(() => {
  if (!currentArmature.value) return []

  return sortByValue(
    store.getBonesByArmatureId(currentArmature.value.id).map((b) => ({
      value: b.id,
      label: b.name,
    })),
    'label'
  )
})

function startPickBone(val?: PickerOptions) {
  canvasStore.dispatchCanvasEvent({
    type: 'state',
    data: { name: 'pick-bone', options: val },
  })
}
</script>

<style scoped>
.weight-panel {
  text-align: left;
}
h4 {
  margin-bottom: 8px;
}
</style>
