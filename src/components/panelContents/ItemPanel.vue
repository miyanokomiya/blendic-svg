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
          @update:model-value="changeTranslateX"
        />
        <KeyDot
          :status="keyframeStatusMap.translateX"
          :updated="posePropsUpdatedStatus.translateX"
          @create="createKeyframe('translateX')"
          @delete="deleteKeyframe('translateX')"
        />
      </InlineField>
      <InlineField label="y" :label-width="labelWidth">
        <SliderInput
          :model-value="draftTransform.translateY"
          :disabled="connected"
          @update:model-value="changeTranslateY"
        />
        <KeyDot
          :status="keyframeStatusMap.translateY"
          :updated="posePropsUpdatedStatus.translateY"
          @create="createKeyframe('translateY')"
          @delete="deleteKeyframe('translateY')"
        />
      </InlineField>
      <h5>Rotate</h5>
      <InlineField :label-width="labelWidth">
        <SliderInput
          :model-value="draftTransform.rotate"
          @update:model-value="changeRotate"
        />
        <KeyDot
          data-test-id="key-dot-rotate"
          :status="keyframeStatusMap.rotate"
          :updated="posePropsUpdatedStatus.rotate"
          @create="createKeyframe('rotate')"
          @delete="deleteKeyframe('rotate')"
        />
      </InlineField>
      <h5>Scale</h5>
      <InlineField label="x" :label-width="labelWidth">
        <SliderInput
          :step="0.1"
          :model-value="draftTransform.scaleX"
          @update:model-value="changeScaleX"
        />
        <KeyDot
          :status="keyframeStatusMap.scaleX"
          :updated="posePropsUpdatedStatus.scaleX"
          @create="createKeyframe('scaleX')"
          @delete="deleteKeyframe('scaleX')"
        />
      </InlineField>
      <InlineField label="y" :label-width="labelWidth">
        <SliderInput
          :step="0.1"
          :model-value="draftTransform.scaleY"
          @update:model-value="changeScaleY"
        />
        <KeyDot
          :status="keyframeStatusMap.scaleY"
          :updated="posePropsUpdatedStatus.scaleY"
          @create="createKeyframe('scaleY')"
          @delete="deleteKeyframe('scaleY')"
        />
      </InlineField>
      <InlineField>
        <button
          type="button"
          class="color-button"
          @click="toggleShowColorPicker"
        >
          <ColorRect :hsva="hsva" />
        </button>
        <div v-if="showColorPicker" class="color-popup">
          <ColorPicker
            class="color-picker"
            :model-value="hsva"
            extra-hue
            @update:model-value="updatePoseByColor"
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
          @update:model-value="changeBoneHeadX"
        />
      </InlineField>
      <InlineField label="y" :label-width="labelWidth">
        <SliderInput
          :model-value="draftBone.headY"
          @update:model-value="changeBoneHeadY"
        />
      </InlineField>
      <h5>Tail</h5>
      <InlineField label="x" :label-width="labelWidth">
        <SliderInput
          :model-value="draftBone.tailX"
          @update:model-value="changeBoneTailX"
        />
      </InlineField>
      <InlineField label="y" :label-width="labelWidth">
        <SliderInput
          :model-value="draftBone.tailY"
          @update:model-value="changeBoneTailY"
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
import { Bone, getTransform, IdMap, Transform } from '/@/models'
import { useStore } from '/@/store'
import { useAnimationStore } from '/@/store/animation'
import { useCanvasStore } from '/@/store/canvas'
import { addPoseTransform, editTransform } from '/@/utils/armatures'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import WeightPanel from '/@/components/panelContents/WeightPanel.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import ColorPicker from '/@/components/molecules/ColorPicker.vue'
import ColorRect from '/@/components/atoms/ColorRect.vue'
import KeyDot from '/@/components/atoms/KeyDot.vue'
import { posedHsva } from '/@/utils/attributesResolver'
import { HSVA, hsvaToTransform } from '/@/utils/color'
import { getKeyframeExistedPropsMap } from '/@/utils/keyframes'
import { mapReduce } from '/@/utils/commons'
import { KeyframeBonePropKey, KeyframeStatus } from '/@/models/keyframe'

export default defineComponent({
  components: {
    SliderInput,
    WeightPanel,
    InlineField,
    ColorPicker,
    ColorRect,
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
      if (canvasStore.canvasMode.value === 'object') {
        return undefined
      }

      const original = store.lastSelectedBone.value
      if (!original) return undefined

      if (canvasStore.canvasMode.value === 'edit') {
        return editTransform(
          original,
          canvasStore.getEditTransforms(original.id),
          store.selectedBones.value[original.id] || {}
        )
      }

      return store.lastSelectedBone.value
    })

    const connected = computed(() => {
      return targetBone.value?.connected
    })

    const targetTransform = computed((): Transform | undefined => {
      if (!targetBone.value) return undefined
      if (canvasStore.canvasMode.value !== 'pose') return undefined

      return addPoseTransform(
        animationStore.getCurrentSelfTransforms(targetBone.value.id),
        canvasStore.getEditTransforms(targetBone.value.id)
      )
    })

    const showColorPicker = ref(false)
    function toggleShowColorPicker() {
      showColorPicker.value = !showColorPicker.value
    }

    const hsva = computed(() => {
      if (!targetTransform.value) return ''
      return posedHsva(targetTransform.value)
    })
    function updatePoseByColor(hsva: HSVA, seriesKey?: string) {
      if (!targetTransform.value) return

      const t = hsvaToTransform(hsva)
      draftTransform.translateX = t.translate.x
      draftTransform.translateY = t.translate.y
      draftTransform.rotate = t.rotate
      draftTransform.scaleX = t.scale.x
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

    const posePropsUpdatedStatus = computed<
      Partial<{ [key in KeyframeBonePropKey]: boolean }>
    >(() => {
      const target = targetBone.value
      if (!target) return {}

      const editedTransform = animationStore.getBoneEditedTransforms(
        targetBone.value!.id
      )
      return {
        translateX: editedTransform.translate.x !== 0,
        translateY: editedTransform.translate.y !== 0,
        scaleX: editedTransform.scale.x !== 0,
        scaleY: editedTransform.scale.y !== 0,
        rotate: editedTransform.rotate !== 0,
      }
    })

    const keyframeStatusMap = computed<IdMap<KeyframeStatus>>(() => {
      if (!targetBone.value) return {}

      const keyframes =
        animationStore.keyframeMapByTargetId.value[targetBone.value.id]
      if (!keyframes) return {}

      const currentFrame = animationStore.currentFrame.value
      return mapReduce(getKeyframeExistedPropsMap(keyframes).props, (list) => {
        return list.some((k) => k.frame === currentFrame) ? 'self' : 'others'
      })
    })

    function createKeyframe(key: KeyframeBonePropKey) {
      if (!targetBone.value) return
      animationStore.execInsertKeyframe({ [key]: true })
    }
    function deleteKeyframe(key: KeyframeBonePropKey) {
      if (!targetBone.value) return
      animationStore.execDeleteTargetKeyframe(targetBone.value.id, key)
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
      canvasMode: canvasStore.canvasMode,
      targetBone,
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
      posePropsUpdatedStatus,
      createKeyframe,
      deleteKeyframe,
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
.color-button {
  display: block;
  width: 100%;
  height: 20px;
  border: solid 1px #aaa;
  > * {
    width: 100%;
  }
}
.color-popup {
  position: relative;
  top: 10px;
  left: -50%;
  z-index: 1;
  .color-picker {
    position: fixed;
    transform: translateX(-50%);
    border: solid 1px #aaa;
  }
}
</style>
