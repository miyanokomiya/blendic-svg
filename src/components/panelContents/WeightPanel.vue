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
      <BlockField label="Armature">
        <SelectField v-model="armatureId" :options="armatureOptions" />
      </BlockField>
      <BlockField label="Bone">
        <SelectField v-model="boneId" :options="boneOptions" />
      </BlockField>
    </form>
    <div v-else>
      <p>No Item</p>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useStore } from '/@/store'
import { useCanvasStore } from '/@/store/canvas'
import SelectField from '/@/components/atoms/SelectField.vue'
import BlockField from '/@/components/atoms/BlockField.vue'
import { useElementStore } from '/@/store/element'
import { sortByValue } from '/@/utils/commons'

export default defineComponent({
  components: { SelectField, BlockField },
  setup() {
    const store = useStore()
    const canvasStore = useCanvasStore()
    const elementStore = useElementStore()

    const canvasMode = computed(() => canvasStore.state.canvasMode)

    const targetActor = computed(() => {
      return elementStore.lastSelectedActor.value
    })

    const targetElement = computed(() => {
      return elementStore.lastSelectedElement.value
    })

    const armatureId = computed({
      get(): string {
        return elementStore.lastSelectedActor.value?.armatureId ?? ''
      },
      set(val: string) {
        elementStore.updateArmatureId(val)
      },
    })

    const currentArmature = computed(() => {
      return store.state.armatures.find((a) => a.id === armatureId.value)
    })

    const armatureOptions = computed(() => {
      return sortByValue(
        store.state.armatures.map((a) => ({ value: a.id, label: a.name })),
        'label'
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

    const boneOptions = computed(() => {
      if (!currentArmature.value) return []

      return sortByValue(
        currentArmature.value?.bones.map((b) => ({
          value: b.id,
          label: b.name,
        })),
        'label'
      )
    })

    return {
      canvasMode,
      targetActor,
      targetElement,
      armatureId,
      armatureOptions,
      boneId,
      boneOptions,
    }
  },
})
</script>

<style lang="scss" scoped>
.weight-panel {
  text-align: left;
}
h4 {
  margin-bottom: 8px;
}
</style>
