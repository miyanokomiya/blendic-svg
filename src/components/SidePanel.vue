<template>
  <div class="root">
    <form v-if="selectedObjectType === 'armature'" @submit.prevent>
      <h2>Armature</h2>
      <div class="field inline">
        <label>Name</label>
        <input v-model="draftName" type="text" @change="changeName" />
      </div>
    </form>
    <form v-if="selectedObjectType === 'born'" @submit.prevent>
      <h2>Born</h2>
      <div class="field inline">
        <label>Name</label>
        <input v-model="draftName" type="text" />
      </div>
      <div class="field inline">
        <label>Parent</label>
        <select v-model="parentId">
          <option value="">-- None --</option>
          <option v-for="born in otherBorns" :key="born.id" :value="born.id">
            {{ born.name }}
          </option>
        </select>
      </div>
      <div class="field inline">
        <label>Connect</label>
        <input v-model="connected" type="checkbox" />
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from 'vue'
import { useStore } from '/@/store/index'

export default defineComponent({
  setup() {
    const store = useStore()
    const draftName = ref('')

    const otherBorns = computed(() => {
      if (!store.lastSelectedArmature.value) return []
      return store.lastSelectedArmature.value.borns.filter(
        (b) => b.id !== store.state.lastSelectedBornId
      )
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
      otherBorns,
      selectedObjectType,
      connected: computed({
        get(): boolean {
          return store.lastSelectedBorn.value?.connected ?? false
        },
        set(val: boolean) {
          store.setBornConnection(val)
        },
      }),
      parentId: computed({
        get(): string {
          return store.lastSelectedBorn.value?.parentId ?? ''
        },
        set(val: string) {
          store.setBornParent(val || undefined)
        },
      }),
      changeName() {
        if (selectedObjectType.value === 'born')
          store.updateBornName(draftName.value)
        if (selectedObjectType.value === 'armature')
          store.updateArmatureName(draftName.value)
      },
    }
  },
})
</script>

<style lang="scss" scoped>
.root {
  padding: 10px;
  border: solid 1px black;
}
h2 {
  margin: 0 0 10px;
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
