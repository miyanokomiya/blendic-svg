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
      <template v-if="targetElement && targetNativeElement">
        <template v-if="targetNativeElement.tag === 'svg'">
          <BlockField label="Viewbox">
            <SelectField v-model="viewBoxBoneId" :options="boneOptions" />
          </BlockField>
        </template>
        <template v-else>
          <BlockField label="Transform">
            <SelectField v-model="boneId" :options="boneOptions" />
          </BlockField>
          <InlineField label="Fill" between>
            <CheckboxInput v-model="fillType" label="HSL" />
          </InlineField>
          <BlockField>
            <SelectField v-model="fillBoneId" :options="boneOptions" />
          </BlockField>
          <InlineField label="Stroke" between>
            <CheckboxInput v-model="strokeType" label="HSL" />
          </InlineField>
          <BlockField>
            <SelectField v-model="strokeBoneId" :options="boneOptions" />
          </BlockField>
        </template>
      </template>
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
import InlineField from '/@/components/atoms/InlineField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import { useElementStore } from '/@/store/element'
import { sortByValue } from '/@/utils/commons'

export default defineComponent({
  components: { SelectField, BlockField, InlineField, CheckboxInput },
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
    const targetNativeElement = computed(() => {
      return elementStore.lastSelectedNativeElement.value
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
    const fillBoneId = computed({
      get(): string {
        return targetElement.value?.fillBoneId ?? ''
      },
      set(val: string) {
        elementStore.updateElement({ fillBoneId: val })
      },
    })
    const fillType = computed({
      get(): boolean {
        return targetElement.value?.fillType === 'hsl'
      },
      set(hsl: boolean) {
        elementStore.updateElement({ fillType: hsl ? 'hsl' : 'rgb' })
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
    const strokeType = computed({
      get(): boolean {
        return targetElement.value?.strokeType === 'hsl'
      },
      set(hsl: boolean) {
        elementStore.updateElement({ strokeType: hsl ? 'hsl' : 'rgb' })
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
      targetNativeElement,
      armatureId,
      armatureOptions,
      boneOptions,
      boneId,
      fillBoneId,
      fillType,
      strokeBoneId,
      strokeType,
      viewBoxBoneId,
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
