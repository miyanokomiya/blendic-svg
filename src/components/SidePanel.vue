<template>
  <div class="root">
    <form v-if="selectedObjectType === 'armature'" @submit.prevent>
      <h3>Armature</h3>
      <div class="field inline">
        <label>Name</label>
        <input v-model="draftName" type="text" @change="changeArmatureName" />
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
        <span class="select">
          <select v-model="parentId">
            <option value="">-- None --</option>
            <option v-for="born in otherBorns" :key="born.id" :value="born.id">
              {{ born.name }}
            </option>
          </select>
        </span>
      </div>
      <div class="field inline">
        <label>Connect</label>
        <input v-model="connected" type="checkbox" :disabled="!parentId" />
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
        (b) => b.id !== store.lastSelectedBorn.value?.id
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
        store.updateArmatureName(draftName.value)
      },
      changeBornName() {
        store.updateBorn({ name: draftName.value })
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
h3 {
  margin-bottom: 10px;
}
input[type='text'] {
  padding: 2px 4px;
  border: solid 1px #000;
}
.select {
  position: relative;
  select {
    width: 100%;
    padding: 1px 12px 0 0;
    border: solid 1px #000;
  }
  &::after {
    display: block;
    content: ' ';
    position: absolute;
    top: 8px;
    right: 4px;
    width: 0;
    height: 0;
    pointer-events: none;
    border-top: solid 8px #000;
    border-left: solid 6px transparent;
    border-right: solid 6px transparent;
  }
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
