<template>
  <div class="animation-panel-root">
    <div class="top">
      <div class="select-action">
        <SelectField v-model="selectedActionId" :options="actionOptions" />
      </div>
      <input v-model="draftName" type="text" @change="changeActionName" />
      <button class="add-action" @click="addAction">+</button>
      <button class="delete-action" @click="deleteAction">x</button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { useAnimationStore } from '../store/Animation'
import SelectField from './atoms/SelectField.vue'

export default defineComponent({
  components: { SelectField },
  setup() {
    const animationStore = useAnimationStore()

    const draftName = ref('')

    const selectedAction = computed(() => animationStore.selectedAction.value)

    watch(
      selectedAction,
      () => (draftName.value = selectedAction.value?.name ?? '')
    )

    return {
      actions: animationStore.actions,
      draftName,
      changeActionName: () => {
        if (!draftName.value) return
        animationStore.updateAction({ name: draftName.value })
      },
      addAction: animationStore.addAction,
      deleteAction: animationStore.deleteAction,
      actionOptions: computed(() =>
        animationStore.actions.map((a) => ({ value: a.id, label: a.name }))
      ),
      selectedActionId: computed({
        get: () => selectedAction.value?.id ?? '',
        set: (id: string) => animationStore.selectAction(id),
      }),
    }
  },
})
</script>

<style lang="scss" scoped>
.top {
  display: flex;
  align-items: center;
  > * {
    margin-right: 8px;
  }
  .select-action {
    width: 160px;
  }
  button {
    width: 20px;
    height: 20px;
    border: solid 1px #000;
  }
}
</style>
