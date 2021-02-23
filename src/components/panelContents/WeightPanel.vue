<template>
  <div class="weight-panel">
    <form v-if="canvasMode === 'weight'" @submit.prevent>
      <h4>Weight Paint</h4>
      <div class="field">
        <label>Armature</label>
        <SelectField v-model="armatureId" :options="armatureOptions" />
      </div>
      <div v-if="targetElement" class="field">
        <label>Born</label>
        <SelectField v-model="bornId" :options="bornOptions" />
      </div>
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
import { useElementStore } from '/@/store/element'

export default defineComponent({
  components: { SelectField },
  setup() {
    const store = useStore()
    const canvasStore = useCanvasStore()
    const elementStore = useElementStore()

    const canvasMode = computed(() => canvasStore.state.canvasMode)

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
      return store.state.armatures.map((a) => ({ value: a.id, label: a.name }))
    })

    const bornId = computed({
      get(): string {
        return targetElement.value?.bornId ?? ''
      },
      set(val: string) {
        elementStore.updateElement({ bornId: val })
      },
    })

    const bornOptions = computed(() => {
      return (
        currentArmature.value?.borns.map((b) => ({
          value: b.id,
          label: b.name,
        })) ?? []
      )
    })

    return {
      canvasMode,
      targetElement,
      armatureId,
      armatureOptions,
      bornId,
      bornOptions,
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
* + h4 {
  margin-top: 8px;
}
form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .field {
    margin-bottom: 8px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    &:last-child {
      margin-bottom: 0;
    }
    > label {
      margin-bottom: 6px;
    }
    > label + * {
      margin-left: auto;
      width: 100%;
    }
  }
}
</style>
