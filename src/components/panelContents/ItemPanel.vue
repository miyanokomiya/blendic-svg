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
        <KeyDot
          :status="keyframeStatusMap.translateX"
          @update:status="(val) => updateKeyframeStatus('translateX', val)"
        />
      </InlineField>
      <InlineField label="y" :label-width="labelWidth">
        <SliderInput
          :model-value="draftTransform.translateY"
          :disabled="connected"
          @update:modelValue="changeTranslateY"
        />
        <KeyDot
          :status="keyframeStatusMap.translateY"
          @update:status="(val) => updateKeyframeStatus('translateY', val)"
        />
      </InlineField>
      <h5>Rotate</h5>
      <InlineField :label-width="labelWidth">
        <SliderInput
          :model-value="draftTransform.rotate"
          @update:modelValue="changeRotate"
        />
        <KeyDot
          :status="keyframeStatusMap.rotate"
          @update:status="(val) => updateKeyframeStatus('rotate', val)"
        />
      </InlineField>
      <h5>Scale</h5>
      <InlineField label="x" :label-width="labelWidth">
        <SliderInput
          :step="0.1"
          :model-value="draftTransform.scaleX"
          @update:modelValue="changeScaleX"
        />
        <KeyDot
          :status="keyframeStatusMap.scaleX"
          @update:status="(val) => updateKeyframeStatus('scaleX', val)"
        />
      </InlineField>
      <InlineField label="y" :label-width="labelWidth">
        <SliderInput
          :step="0.1"
          :model-value="draftTransform.scaleY"
          @update:modelValue="changeScaleY"
        />
        <KeyDot
          :status="keyframeStatusMap.scaleY"
          @update:status="(val) => updateKeyframeStatus('scaleY', val)"
        />
      </InlineField>
      <InlineField>
        <button
          type="button"
          class="color-block"
          :style="{ 'background-color': color }"
          @click="toggleShowColorPicker"
        />
        <div v-if="showColorPicker" class="color-popup">
          <ColorPicker
            class="color-picker"
            :model-value="hsva"
            extra-hue
            @update:modelValue="updatePoseByColor"
          />
        </div>
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
import { computed, defineComponent, reactive, ref, watchEffect } from 'vue'
import { Bone, getTransform, Transform } from '/@/models'
import { useStore } from '/@/store'
import { useAnimationStore } from '/@/store/animation'
import { useCanvasStore } from '/@/store/canvas'
import { convolutePoseTransforms, editTransform } from '/@/utils/armatures'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import WeightPanel from '/@/components/panelContents/WeightPanel.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import ColorPicker from '/@/components/molecules/ColorPicker.vue'
import KeyDot from '/@/components/atoms/KeyDot.vue'
import { posedColor, posedHsva } from '/@/utils/attributesResolver'
import { HSVA } from '/@/utils/color'
import { getKeyframeExistedPropsMap } from '/@/utils/keyframes'
import { mapReduce } from '/@/utils/commons'
import { KeyframeBonePropKey, KeyframeStatus } from '/@/models/keyframe'

export default defineComponent({
  components: {
    SliderInput,
    WeightPanel,
    InlineField,
    ColorPicker,
    KeyDot,
  },
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

    const showColorPicker = ref(false)
    function toggleShowColorPicker() {
      showColorPicker.value = !showColorPicker.value
    }

    const color = computed(() => {
      if (!targetTransform.value) return ''
      return posedColor(targetTransform.value)
    })
    const hsva = computed(() => {
      if (!targetTransform.value) return ''
      return posedHsva(targetTransform.value)
    })
    function updatePoseByColor(hsva: HSVA, seriesKey?: string) {
      if (!targetTransform.value) return

      draftTransform.translateX = hsva.s * 100
      draftTransform.translateY = hsva.v * 100
      draftTransform.rotate = hsva.h
      draftTransform.scaleX = hsva.a
      changeTransform(seriesKey)
    }

    function changeBoneHeadX(val: number, seriesKey?: string) {
      draftBone.headX = val
      changeBone(seriesKey)
    }
    function changeBoneHeadY(val: number, seriesKey?: string) {
      draftBone.headY = val
      changeBone(seriesKey)
    }
    function changeBoneTailX(val: number, seriesKey?: string) {
      draftBone.tailX = val
      changeBone(seriesKey)
    }
    function changeBoneTailY(val: number, seriesKey?: string) {
      draftBone.tailY = val
      changeBone(seriesKey)
    }
    function changeBone(seriesKey?: string) {
      if (!targetBone.value) return
      store.updateBones(
        {
          [targetBone.value.id]: {
            head: { x: draftBone.headX, y: draftBone.headY },
            tail: { x: draftBone.tailX, y: draftBone.tailY },
          },
        },
        seriesKey
      )
    }

    function changeTranslateX(val: number, seriesKey?: string) {
      draftTransform.translateX = val
      changeTransform(seriesKey)
    }
    function changeTranslateY(val: number, seriesKey?: string) {
      draftTransform.translateY = val
      changeTransform(seriesKey)
    }
    function changeRotate(val: number, seriesKey?: string) {
      draftTransform.rotate = val
      changeTransform(seriesKey)
    }
    function changeScaleX(val: number, seriesKey?: string) {
      draftTransform.scaleX = val
      changeTransform(seriesKey)
    }
    function changeScaleY(val: number, seriesKey?: string) {
      draftTransform.scaleY = val
      changeTransform(seriesKey)
    }

    function changeTransform(seriesKey?: string) {
      if (!targetBone.value) return
      animationStore.pastePoses(
        {
          [targetBone.value.id]: getTransform({
            translate: {
              x: draftTransform.translateX,
              y: draftTransform.translateY,
            },
            rotate: draftTransform.rotate,
            scale: { x: draftTransform.scaleX, y: draftTransform.scaleY },
          }),
        },
        seriesKey
      )
    }

    const keyframeStatusMap = computed(() => {
      if (!targetBone.value) return {}

      const keyframes =
        animationStore.keyframeMapByTargetId.value[targetBone.value.id]
      if (!keyframes) return {}

      const currentFrame = animationStore.currentFrame.value
      return mapReduce(getKeyframeExistedPropsMap(keyframes).props, (list) => {
        return list.some((k) => k.frame === currentFrame)
          ? 'checked'
          : 'enabled'
      })
    })

    function updateKeyframeStatus(
      key: KeyframeBonePropKey,
      status: KeyframeStatus
    ) {
      if (!targetBone.value) return

      if (status === 'checked') {
        animationStore.execInsertKeyframe({ [key]: true })
      } else {
        animationStore.execDeleteTargetKeyframe(targetBone.value.id, key)
      }
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
      color,
      hsva,
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
      showColorPicker,
      toggleShowColorPicker,
      updatePoseByColor,

      keyframeStatusMap,
      updateKeyframeStatus,
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
.color-block {
  display: block;
  width: 100%;
  height: 20px;
  border: solid 1px #aaa;
}
.color-popup {
  position: relative;
  z-index: 1;
  .color-picker {
    position: absolute;
    top: 4px;
    left: 50%;
    transform: translateX(-50%);
    border: solid 1px #aaa;
  }
}
</style>
