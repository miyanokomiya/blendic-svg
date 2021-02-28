<!--
This file is part of Blendic SVG.

Blendic SVG is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Blendic SVG is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Blendic SVG.  If not, see <https://www.gnu.org/licenses/>.

Copyright (C) 2021, Tomoya Komiyama.
-->

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
      <label class="checkbox-field">
        Inherit weight
        <input v-model="isInheritWeight" type="checkbox" />
      </label>
    </div>
    <h3>Export</h3>
    <div class="menu-list">
      <button type="button" @click="bakeAction">Bake</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useStrage } from '/@/composables/strage'

export default defineComponent({
  emits: [],
  setup() {
    const isInheritWeight = ref(false)

    return {
      isInheritWeight,
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
        strage.loadSvgFile(isInheritWeight.value)
      },
      bakeAction() {
        const strage = useStrage()
        strage.bakeAction()
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
.checkbox-field {
  display: flex;
  align-items: center;
  > input {
    margin-left: 8px;
  }
}
</style>
