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
      <button type="button" @click="openFile">Open</button>
      <button type="button" @click="overrideProjectFile">Save</button>
      <button v-if="fileSystemEnable" type="button" @click="saveProjectFile">
        Save as..
      </button>
    </div>
    <h3>Import</h3>
    <div class="menu-list">
      <button type="button" @click="importSvg">SVG</button>
      <CheckboxInput v-model="isInheritWeight" label="Inherit weight" />
    </div>
    <h3>Export</h3>
    <div class="menu-list">
      <button type="button" @click="bakeAction">Baked Action</button>
      <button type="button" @click="exportSvg">Posed SVG</button>
    </div>
    <h3>Version {{ appVersion }}</h3>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useStrage } from '/@/composables/strage'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'

export default defineComponent({
  components: { CheckboxInput },
  emits: [],
  setup() {
    const isInheritWeight = ref(true)
    const strage = useStrage()

    return {
      appVersion: process.env.APP_VERSION,
      isInheritWeight,
      fileSystemEnable: strage.fileSystemEnable,
      openFile: strage.loadProjectFile,
      saveProjectFile: strage.saveProjectFile,
      overrideProjectFile: strage.overrideProjectFile,
      importSvg() {
        strage.loadSvgFile(isInheritWeight.value)
      },
      bakeAction: strage.bakeAction,
      exportSvg: strage.bakeSvg,
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
