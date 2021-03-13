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
  <WeightPanel v-if="canvasMode === 'weight'" />
  <div v-else-if="canvasMode === 'pose'" class="item-panel">
    <h4>Pose</h4>
    <form v-if="targetTransform" @submit.prevent>
      <h5>Translate</h5>
      <InlineField label="x" :label-width="labelWidth">
        <SliderInput
          :model-value="draftTransform.translateX"
          :disabled="connected"
          @update:modelValue="changeTranslateX"
        />
      </InlineField>
      <InlineField label="y" :label-width="labelWidth">
        <SliderInput
          :model-value="draftTransform.translateY"
          :disabled="connected"
          @update:modelValue="changeTranslateY"
        />
      </InlineField>
      <h5>Rotate</h5>
      <InlineField :label-width="labelWidth">
        <SliderInput
          :model-value="draftTransform.rotate"
          @update:modelValue="changeRotate"
        />
      </InlineField>
      <h5>Scale</h5>
      <InlineField label="x" :label-width="labelWidth">
        <SliderInput
          :step="0.1"
          :model-value="draftTransform.scaleX"
          @update:modelValue="changeScaleX"
        />
      </InlineField>
      <InlineField label="y" :label-width="labelWidth">
        <SliderInput
          :step="0.1"
          :model-value="draftTransform.scaleY"
          @update:modelValue="changeScaleY"
        />
      </InlineField>
    </form>
    <div v-else>
      <p>No Item</p>
    </div>
  </div>
  <div v-else-if="canvasMode === 'edit'" class="item-panel">
    <h4>Bone</h4>
    <form v-if="targetBone" @submit.prevent>
      <h5>Head</h5>
      <InlineField label="x" :label-width="labelWidth">
        <SliderInput
          :model-value="draftBone.headX"
          @update:modelValue="changeBoneHeadX"
        />
      </InlineField>
      <InlineField label="y" :label-width="labelWidth">
        <SliderInput
          :model-value="draftBone.headY"
          @update:modelValue="changeBoneHeadY"
        />
      </InlineField>
      <h5>Tail</h5>
      <InlineField label="x" :label-width="labelWidth">
        <SliderInput
          :model-value="draftBone.tailX"
          @update:modelValue="changeBoneTailX"
        />
      </InlineField>
      <InlineField label="y" :label-width="labelWidth">
        <SliderInput
          :model-value="draftBone.tailY"
          @update:modelValue="changeBoneTailY"
        />
      </InlineField>
    </form>
    <div v-else>
      <p>No Item</p>
    </div>
  </div>
  <div v-else>
    <p>No Item</p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, watchEffect } from 'vue'
import { Bone, getTransform, Transform } from '/@/models'
import { useStore } from '/@/store'
import { useAnimationStore } from '/@/store/animation'
import { useCanvasStore } from '/@/store/canvas'
import { convolutePoseTransforms, editTransform } from '/@/utils/armatures'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import WeightPanel from '/@/components/panelContents/WeightPanel.vue'
import InlineField from '/@/components/atoms/InlineField.vue'

export default defineComponent({
  components: { SliderInput, WeightPanel, InlineField },
  setup() {
    const store = useStore()
    const animationStore = useAnimationStore()
    const canvasStore = useCanvasStore()

    const draftTransform = reactive({
      translateX: 0,
      translateY: 0,
      rotate: 0,
      scaleX: 0,
      scaleY: 0,
    })

    const draftBone = reactive({
      headX: 0,
      headY: 0,
      tailX: 0,
      tailY: 0,
    })

    const targetBone = computed((): Bone | undefined => {
      if (canvasStore.state.canvasMode === 'object') {
        return undefined
      }

      const original = store.lastSelectedBone.value
      if (!original) return undefined

      if (canvasStore.state.canvasMode === 'edit') {
        return editTransform(
          original,
          canvasStore.getEditTransforms(original.id),
          store.state.selectedBones[original.id] || {}
        )
      }

      return store.lastSelectedBone.value
    })

    const connected = computed(() => {
      return targetBone.value?.connected
    })

    const targetTransform = computed((): Transform | undefined => {
      if (!targetBone.value) return undefined
      if (canvasStore.state.canvasMode !== 'pose') return undefined
      return convolutePoseTransforms([
        animationStore.getCurrentSelfTransforms(targetBone.value.id),
        canvasStore.getEditTransforms(targetBone.value.id),
      ])
    })

    function changeBoneHeadX(val: number) {
      draftBone.headX = val
      changeBone()
    }
    function changeBoneHeadY(val: number) {
      draftBone.headY = val
      changeBone()
    }
    function changeBoneTailX(val: number) {
      draftBone.tailX = val
      changeBone()
    }
    function changeBoneTailY(val: number) {
      draftBone.tailY = val
      changeBone()
    }
    function changeBone() {
      if (!targetBone.value) return
      store.updateBones({
        [targetBone.value.id]: {
          head: { x: draftBone.headX, y: draftBone.headY },
          tail: { x: draftBone.tailX, y: draftBone.tailY },
        },
      })
    }

    function changeTranslateX(val: number) {
      draftTransform.translateX = val
      changeTransform()
    }
    function changeTranslateY(val: number) {
      draftTransform.translateY = val
      changeTransform()
    }
    function changeRotate(val: number) {
      draftTransform.rotate = val
      changeTransform()
    }
    function changeScaleX(val: number) {
      draftTransform.scaleX = val
      changeTransform()
    }
    function changeScaleY(val: number) {
      draftTransform.scaleY = val
      changeTransform()
    }

    function changeTransform() {
      if (!targetBone.value) return
      animationStore.pastePoses({
        [targetBone.value.id]: getTransform({
          translate: {
            x: draftTransform.translateX,
            y: draftTransform.translateY,
          },
          rotate: draftTransform.rotate,
          scale: { x: draftTransform.scaleX, y: draftTransform.scaleY },
        }),
      })
    }

    watchEffect(() => {
      if (!targetBone.value) return

      draftBone.headX = targetBone.value.head.x
      draftBone.headY = targetBone.value.head.y
      draftBone.tailX = targetBone.value.tail.x
      draftBone.tailY = targetBone.value.tail.y
    })
    watchEffect(() => {
      if (!targetTransform.value) return

      draftTransform.translateX = targetTransform.value.translate.x
      draftTransform.translateY = targetTransform.value.translate.y
      draftTransform.rotate = targetTransform.value.rotate
      draftTransform.scaleX = targetTransform.value.scale.x
      draftTransform.scaleY = targetTransform.value.scale.y
    })

    return {
      labelWidth: '20px',
      canvasMode: computed(() => canvasStore.state.canvasMode),
      targetBone,
      draftBone,
      changeBoneHeadX,
      changeBoneHeadY,
      changeBoneTailX,
      changeBoneTailY,
      targetTransform,
      draftTransform,
      changeTranslateX,
      changeTranslateY,
      changeRotate,
      changeScaleX,
      changeScaleY,
      connected,
    }
  },
})
</script>

<style lang="scss" scoped>
.item-panel {
  text-align: left;
}
h4,
h5 {
  margin-bottom: 8px;
}
* + h5 {
  margin-top: 8px;
}
</style>
