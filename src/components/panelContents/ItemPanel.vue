<template>
  <div class="item-panel">
    <h4>Item</h4>
    <form v-if="targetTransform" @submit.prevent>
      <h5>Translate</h5>
      <div class="field">
        <label>x</label>
        <NumberInput
          :model-value="draftTransform.translateX"
          @update:modelValue="changeTranslateX"
        />
      </div>
      <div class="field">
        <label>y</label>
        <NumberInput
          :model-value="draftTransform.translateY"
          @update:modelValue="changeTranslateY"
        />
      </div>
      <h5>Rotate</h5>
      <div class="field">
        <NumberInput
          :model-value="draftTransform.rotate"
          @update:modelValue="changeRotate"
        />
      </div>
    </form>
    <form v-else-if="targetBone" @submit.prevent>
      <h5>Head</h5>
      <div class="field">
        <label>x</label>
        <NumberInput
          :model-value="draftBone.headX"
          @update:modelValue="changeBoneHeadX"
        />
      </div>
      <div class="field">
        <label>y</label>
        <NumberInput
          :model-value="draftBone.headY"
          @update:modelValue="changeBoneHeadY"
        />
      </div>
      <h5>Tail</h5>
      <div class="field">
        <label>x</label>
        <NumberInput
          :model-value="draftBone.tailX"
          @update:modelValue="changeBoneTailX"
        />
      </div>
      <div class="field">
        <label>y</label>
        <NumberInput
          :model-value="draftBone.tailY"
          @update:modelValue="changeBoneTailY"
        />
      </div>
    </form>
    <div v-else>
      <p>No Item</p>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, watchEffect } from 'vue'
import { Bone, getTransform, Transform } from '/@/models'
import { useStore } from '/@/store'
import { useAnimationStore } from '/@/store/animation'
import { useCanvasStore } from '/@/store/canvas'
import { convolutePoseTransforms, editTransform } from '/@/utils/armatures'
import NumberInput from '/@/components/atoms/NumberInput.vue'

export default defineComponent({
  components: { NumberInput },
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
form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .field {
    margin-bottom: 4px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: right;
    &:last-child {
      margin-bottom: 0;
    }
    > label {
      margin-right: 10px;
      min-width: 10px;
      text-align: left;
    }
    > input {
      width: 90px;
    }
  }
}
</style>
