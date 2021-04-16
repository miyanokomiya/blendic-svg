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
      <button
        type="button"
        :disabled="exportableActions.length === 0"
        @click="showSelectActionDialog"
      >
        Baked Action
      </button>
      <button type="button" @click="exportSvg">Posed SVG</button>
    </div>
    <h3>Version {{ appVersion }}</h3>
    <teleport to="body">
      <DialogBase v-model:open="showSelectActionDialogFlag">
        <template #default>
          <h3>Select Actions</h3>
          <CheckboxInput
            v-for="action in exportableActions"
            :key="action.id"
            v-model="selectedActionIds[action.id]"
            :label="action.name"
          />
        </template>
        <template #buttons>
          <DialogButton @click="closeSelectActionDialog">Cancel</DialogButton>
          <DialogButton type="primary" @click="bakeAction">Export</DialogButton>
        </template>
      </DialogBase>
    </teleport>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useStrage } from '/@/composables/strage'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import DialogBase from '/@/components/molecules/dialogs/DialogBase.vue'
import DialogButton from '/@/components/atoms/DialogButton.vue'
import { useAnimationStore } from '/@/store/animation'
import { useStore } from '/@/store'

export default defineComponent({
  components: { CheckboxInput, DialogBase, DialogButton },
  emits: [],
  setup() {
    const strage = useStrage()
    const isInheritWeight = ref(true)

    const store = useStore()
    const animationStore = useAnimationStore()
    const showSelectActionDialogFlag = ref(false)
    const selectedActionIds = ref<{ [id: string]: boolean }>({})

    const exportableActions = computed(() => {
      return animationStore.actions.value.filter((a) => {
        return store.lastSelectedArmature.value?.id === a.armatureId
      })
    })

    const exportingActionIds = computed(() => {
      return exportableActions.value
        .filter((a) => selectedActionIds.value[a.id])
        .map((a) => a.id)
    })

    return {
      appVersion: process.env.APP_VERSION,

      fileSystemEnable: strage.fileSystemEnable,
      openFile: strage.loadProjectFile,
      saveProjectFile: strage.saveProjectFile,
      overrideProjectFile: strage.overrideProjectFile,

      isInheritWeight,
      importSvg() {
        strage.loadSvgFile(isInheritWeight.value)
      },
      exportSvg: strage.bakeSvg,

      bakeAction: () => strage.bakeAction(exportingActionIds.value),
      selectedActionIds,
      exportableActions,
      showSelectActionDialogFlag,
      showSelectActionDialog: () => (showSelectActionDialogFlag.value = true),
      closeSelectActionDialog: () => (showSelectActionDialogFlag.value = false),
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
