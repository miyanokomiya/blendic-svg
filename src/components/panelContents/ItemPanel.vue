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
    <form v-else-if="targetBorn" @submit.prevent>
      <h5>Head</h5>
      <div class="field">
        <label>x</label>
        <NumberInput
          :model-value="draftBorn.headX"
          @update:modelValue="changeBornHeadX"
        />
      </div>
      <div class="field">
        <label>y</label>
        <NumberInput
          :model-value="draftBorn.headY"
          @update:modelValue="changeBornHeadY"
        />
      </div>
      <h5>Tail</h5>
      <div class="field">
        <label>x</label>
        <NumberInput
          :model-value="draftBorn.tailX"
          @update:modelValue="changeBornTailX"
        />
      </div>
      <div class="field">
        <label>y</label>
        <NumberInput
          :model-value="draftBorn.tailY"
          @update:modelValue="changeBornTailY"
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
import { Born, getTransform, Transform } from '/@/models'
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

    const draftBorn = reactive({
      headX: 0,
      headY: 0,
      tailX: 0,
      tailY: 0,
    })

    const targetBorn = computed((): Born | undefined => {
      if (canvasStore.state.canvasMode === 'object') {
        return undefined
      }

      const original = store.lastSelectedBorn.value
      if (!original) return undefined

      if (canvasStore.state.canvasMode === 'edit') {
        return editTransform(
          original,
          canvasStore.getEditTransforms(original.id),
          store.state.selectedBorns[original.id] || {}
        )
      }

      return store.lastSelectedBorn.value
    })

    const targetTransform = computed((): Transform | undefined => {
      if (!targetBorn.value) return undefined
      if (canvasStore.state.canvasMode !== 'pose') return undefined
      return convolutePoseTransforms([
        animationStore.getCurrentSelfTransforms(targetBorn.value.id),
        canvasStore.getEditTransforms(targetBorn.value.id),
      ])
    })

    function changeBornHeadX(val: number) {
      draftBorn.headX = val
      changeBorn()
    }
    function changeBornHeadY(val: number) {
      draftBorn.headY = val
      changeBorn()
    }
    function changeBornTailX(val: number) {
      draftBorn.tailX = val
      changeBorn()
    }
    function changeBornTailY(val: number) {
      draftBorn.tailY = val
      changeBorn()
    }
    function changeBorn() {
      if (!targetBorn.value) return
      store.updateBorns({
        [targetBorn.value.id]: {
          head: { x: draftBorn.headX, y: draftBorn.headY },
          tail: { x: draftBorn.tailX, y: draftBorn.tailY },
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
      if (!targetBorn.value) return
      animationStore.pastePoses({
        [targetBorn.value.id]: getTransform({
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
      if (!targetBorn.value) return

      draftBorn.headX = targetBorn.value.head.x
      draftBorn.headY = targetBorn.value.head.y
      draftBorn.tailX = targetBorn.value.tail.x
      draftBorn.tailY = targetBorn.value.tail.y
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
      targetBorn,
      draftBorn,
      changeBornHeadX,
      changeBornHeadY,
      changeBornTailX,
      changeBornTailY,
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
