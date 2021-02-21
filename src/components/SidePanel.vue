<template>
  <div>
    <TabPanel
      :tabs="[
        { key: 'detail', label: 'Detail' },
        { key: 'history', label: 'History' },
        { key: 'file', label: 'File' },
      ]"
    >
      <template #detail>
        <form v-if="selectedObjectType === 'armature'" @submit.prevent>
          <h3>Armature</h3>
          <div class="field inline">
            <label>Name</label>
            <input
              v-model="draftName"
              type="text"
              @change="changeArmatureName"
            />
          </div>
        </form>
        <form v-if="selectedObjectType === 'born'" @submit.prevent>
          <h3>Born</h3>
          <div class="field inline">
            <label>Name</label>
            <input v-model="draftName" type="text" @change="changeBornName" />
          </div>
          <div class="field inline">
            <label>Parent</label>
            <SelectField v-model="parentId" :options="parentOptions" />
          </div>
          <div class="field inline">
            <label>Connect</label>
            <input v-model="connected" type="checkbox" :disabled="!parentId" />
          </div>
        </form>
      </template>
      <template #history><HistoryStack /></template>
      <template #file>
        <FilePanel />
      </template>
    </TabPanel>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from 'vue'
import { useStore } from '/@/store/index'
import TabPanel from './TabPanel.vue'
import SelectField from './atoms/SelectField.vue'
import HistoryStack from '/@/components/panelContents/HistoryStack.vue'
import FilePanel from '/@/components/panelContents/FilePanel.vue'

export default defineComponent({
  components: { TabPanel, HistoryStack, SelectField, FilePanel },
  setup() {
    const store = useStore()
    const draftName = ref('')

    const parentOptions = computed(() => {
      if (!store.lastSelectedArmature.value) return []
      return store.lastSelectedArmature.value.borns
        .filter((b) => b.id !== store.lastSelectedBorn.value?.id)
        .map((b) => ({ value: b.id, label: b.name }))
    })

    const selectedObjectType = computed((): 'born' | 'armature' | '' => {
      if (store.lastSelectedBorn.value) return 'born'
      if (store.lastSelectedArmature.value) return 'armature'
      return ''
    })

    function initDraftName() {
      if (store.lastSelectedBorn.value)
        draftName.value = store.lastSelectedBorn.value.name
      else if (store.lastSelectedArmature.value)
        draftName.value = store.lastSelectedArmature.value.name
      else draftName.value = ''
    }

    watch(store.lastSelectedArmature, initDraftName)
    watch(store.lastSelectedBorn, initDraftName)

    return {
      draftName,
      lastSelectedArmature: store.lastSelectedArmature,
      lastSelectedBorn: store.lastSelectedBorn,
      parentOptions,
      selectedObjectType,
      connected: computed({
        get(): boolean {
          return store.lastSelectedBorn.value?.connected ?? false
        },
        set(val: boolean) {
          store.updateBorn({ connected: val })
        },
      }),
      parentId: computed({
        get(): string {
          return store.lastSelectedBorn.value?.parentId ?? ''
        },
        set(val: string) {
          store.updateBorn({ parentId: val })
        },
      }),
      changeArmatureName() {
        if (!draftName.value) return
        store.updateArmatureName(draftName.value)
      },
      changeBornName() {
        if (!draftName.value) return
        store.updateBorn({ name: draftName.value })
      },
    }
  },
})
</script>

<style lang="scss" scoped>
h3 {
  margin-bottom: 10px;
}
form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .field {
    margin-bottom: 10px;
    width: 100%;
    &:last-child {
      margin-bottom: 0;
    }
    &.inline {
      display: flex;
      align-items: center;
      > label {
        margin-right: 10px;
        min-width: 60px;
        text-align: left;
      }
      > label + * {
        flex: 1;
        min-width: 50px; // a magic to fix flex width
      }
    }
  }
}
</style>
