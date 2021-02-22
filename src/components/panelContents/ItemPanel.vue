<template>
  <div class="item-panel">
    <form v-if="targetTransform" @submit.prevent>
      <h4>Translate</h4>
      <div class="field">
        <label>x</label>
        <input
          v-model="draftTransform.translateX"
          type="text"
          @change="changeTransform"
        />
      </div>
      <div class="field">
        <label>y</label>
        <input
          v-model="draftTransform.translateY"
          type="text"
          @change="changeTransform"
        />
      </div>
      <h4>Rotate</h4>
      <div class="field">
        <input
          v-model="draftTransform.rotate"
          type="text"
          @change="changeTransform"
        />
      </div>
      <h4>Scale</h4>
      <div class="field">
        <label>x</label>
        <input
          v-model="draftTransform.scaleX"
          type="text"
          @change="changeTransform"
        />
      </div>
      <div class="field">
        <label>y</label>
        <input
          v-model="draftTransform.scaleY"
          type="text"
          @change="changeTransform"
        />
      </div>
    </form>
    <form v-else-if="targetBorn" @submit.prevent>
      <h4>Head</h4>
      <div class="field">
        <label>x</label>
        <input v-model="draftBorn.headX" type="text" @change="changeBorn" />
      </div>
      <div class="field">
        <label>y</label>
        <input v-model="draftBorn.headY" type="text" @change="changeBorn" />
      </div>
      <h4>Tail</h4>
      <div class="field">
        <label>x</label>
        <input v-model="draftBorn.tailX" type="text" @change="changeBorn" />
      </div>
      <div class="field">
        <label>y</label>
        <input v-model="draftBorn.tailY" type="text" @change="changeBorn" />
      </div>
    </form>
    <div v-else>
      <p>No Item</p>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, watchEffect } from 'vue'
import { Born, Transform } from '/@/models'
import { useStore } from '/@/store'
import { useAnimationStore } from '/@/store/animation'
import { useCanvasStore } from '/@/store/canvas'

export default defineComponent({
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

      return store.lastSelectedBorn.value
    })

    const targetTransform = computed((): Transform | undefined => {
      if (!targetBorn.value) return undefined
      if (canvasStore.state.canvasMode !== 'pose') return undefined
      return animationStore.getCurrentSelfTransforms(targetBorn.value.id)
    })

    function changeBorn() {
      console.log(draftTransform)
    }
    function changeTransform() {
      console.log(draftTransform)
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
      changeBorn,
      targetTransform,
      draftTransform,
      changeTransform,
    }
  },
})
</script>

<style lang="scss" scoped>
.item-panel {
  text-align: left;
}
h4 {
  margin-bottom: 8px;
}
* + h4 {
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
