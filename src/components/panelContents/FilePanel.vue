<template>
  <div class="file-panel">
    <h3>Project</h3>
    <div class="menu-list">
      <button type="button" @click="openFile">Open (Ctrl + o)</button>
      <button type="button" @click="saveProjectFile">Save (Ctrl + s)</button>
    </div>
    <h3>Import</h3>
    <div class="menu-list">
      <button type="button" @click="importSvg">SVG (Ctrl + O)</button>
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
        strage.loadProjectFile()
      },
      saveProjectFile() {
        const strage = useStrage()
        strage.saveProjectFile()
      },
      importSvg() {
        const strage = useStrage()
        strage.loadSvgFile()
      },
    }
  },
})
</script>

<style lang="scss" scoped>
h3 {
  margin-bottom: 10px;
  text-align: left;
}
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
