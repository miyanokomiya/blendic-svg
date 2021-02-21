<template>
  <div class="file-panel">
    <div class="menu-list">
      <button type="button" @click="openFile">Open</button>
      <button type="button" @click="saveFile">Save</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useStrage } from '/@/composables/strage'

export default defineComponent({
  emits: [],
  setup() {
    return {
      openFile() {
        const strage = useStrage()
        strage.loadFile()
      },
      saveFile() {
        const strage = useStrage()
        strage.saveFile()
      },
    }
  },
})
</script>

<style lang="scss" scoped>
.menu-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  > * {
    margin-bottom: 10px;
  }
  > button {
    width: 100%;
    padding: 2px;
    border: solid 1px #ccc;
    border-radius: 4px;
    font-size: 14px;
    &:hover {
      background-color: #eee;
    }
  }
}
</style>
