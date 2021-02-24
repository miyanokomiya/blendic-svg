<template>
  <div>
    <TabPanel
      :tabs="[
        { key: 'detail', label: 'Detail' },
        { key: 'history', label: 'History' },
        { key: 'tree', label: 'Tree' },
        { key: 'file', label: 'File' },
      ]"
      initial-tab="file"
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
        <form v-if="selectedObjectType === 'bone'" @submit.prevent>
          <h3>Bone</h3>
          <div class="field inline">
            <label>Name</label>
            <input v-model="draftName" type="text" @change="changeBoneName" />
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
      <template #tree>
        <TreePanel />
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
import TreePanel from '/@/components/panelContents/TreePanel.vue'

export default defineComponent({
  components: {
    TabPanel,
    HistoryStack,
    SelectField,
    FilePanel,
    TreePanel,
  },
  setup() {
    const store = useStore()
    const draftName = ref('')

    const parentOptions = computed(() => {
      if (!store.lastSelectedArmature.value) return []
      return store.lastSelectedArmature.value.bones
        .filter((b) => b.id !== store.lastSelectedBone.value?.id)
        .map((b) => ({ value: b.id, label: b.name }))
    })

    const selectedObjectType = computed((): 'bone' | 'armature' | '' => {
      if (store.lastSelectedBone.value) return 'bone'
      if (store.lastSelectedArmature.value) return 'armature'
      return ''
    })

    function initDraftName() {
      if (store.lastSelectedBone.value)
        draftName.value = store.lastSelectedBone.value.name
      else if (store.lastSelectedArmature.value)
        draftName.value = store.lastSelectedArmature.value.name
      else draftName.value = ''
    }

    watch(store.lastSelectedArmature, initDraftName)
    watch(store.lastSelectedBone, initDraftName)

    return {
      draftName,
      lastSelectedArmature: store.lastSelectedArmature,
      lastSelectedBone: store.lastSelectedBone,
      parentOptions,
      selectedObjectType,
      connected: computed({
        get(): boolean {
          return store.lastSelectedBone.value?.connected ?? false
        },
        set(val: boolean) {
          store.updateBone({ connected: val })
        },
      }),
      parentId: computed({
        get(): string {
          return store.lastSelectedBone.value?.parentId ?? ''
        },
        set(val: string) {
          store.updateBone({ parentId: val })
        },
      }),
      changeArmatureName() {
        if (!draftName.value) return
        store.updateArmatureName(draftName.value)
      },
      changeBoneName() {
        if (!draftName.value) return
        store.updateBone({ name: draftName.value })
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
