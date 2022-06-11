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
      <template v-if="targetElement">
        <template v-if="targetElement.tag === 'svg'">
          <BlockField label="Viewbox">
            <InlineField>
              <FieldWithButton>
                <SelectField v-model="viewBoxBoneId" :options="boneOptions" />
                <template #button>
                  <button @click="pickBone('viewBoxBoneId')">
                    <EyedropperIcon />
                  </button>
                </template>
              </FieldWithButton>
            </InlineField>
          </BlockField>
        </template>
        <template v-else>
          <BlockField label="Transform">
            <InlineField>
              <FieldWithButton>
                <SelectField v-model="boneId" :options="boneOptions" />
                <template #button>
                  <button @click="pickBone('boneId')">
                    <EyedropperIcon />
                  </button>
                </template>
              </FieldWithButton>
            </InlineField>
          </BlockField>
          <BlockField label="Fill">
            <InlineField>
              <FieldWithButton>
                <SelectField v-model="fillBoneId" :options="boneOptions" />
                <template #button>
                  <button @click="pickBone('fillBoneId')">
                    <EyedropperIcon />
                  </button>
                </template>
              </FieldWithButton>
            </InlineField>
          </BlockField>
          <BlockField label="Stroke">
            <InlineField>
              <FieldWithButton>
                <SelectField v-model="strokeBoneId" :options="boneOptions" />
                <template #button>
                  <button @click="pickBone('strokeBoneId')">
                    <EyedropperIcon />
                  </button>
                </template>
              </FieldWithButton>
            </InlineField>
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
import EyedropperIcon from '/@/components/atoms/EyedropperIcon.vue'
import FieldWithButton from '/@/components/atoms/FieldWithButton.vue'
import { useElementStore } from '/@/store/element'
import { sortByValue } from '/@/utils/commons'

export default defineComponent({
  components: {
    SelectField,
    BlockField,
    InlineField,
    EyedropperIcon,
    FieldWithButton,
  },
  setup() {
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

    const armatureId = computed({
      get(): string {
        return elementStore.lastSelectedActor.value?.armatureId ?? ''
      },
      set(val: string) {
        elementStore.updateArmatureId(val)
      },
    })

    const currentArmature = computed(() => {
      return store.armatures.value.find((a) => a.id === armatureId.value)
    })

    const armatureOptions = computed(() => {
      return sortByValue(
        store.armatures.value.map((a) => ({ value: a.id, label: a.name })),
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

    function pickBone(
      key: 'boneId' | 'fillBoneId' | 'strokeBoneId' | 'viewBoxBoneId'
    ) {
      store.setBonePicker((id) => {
        if (boneOptions.value.some((b) => b.value === id)) {
          elementStore.updateElement({ [key]: id })
        }
      })
    }

    return {
      canvasMode,
      targetActor,
      targetElement,
      armatureId,
      armatureOptions,
      boneOptions,
      boneId,
      fillBoneId,
      strokeBoneId,
      viewBoxBoneId,
      pickBone,
    }
  },
})
</script>

<style scoped>
.weight-panel {
  text-align: left;
}
h4 {
  margin-bottom: 8px;
}
</style>
