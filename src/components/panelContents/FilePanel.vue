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
      <button type="button" @click="showAnimatedSvgSettingDialog">
        Animated SVG
      </button>
    </div>
    <h3>App</h3>
    <InlineField label="Theme" between>
      <ToggleRadioButtons v-model="colorTheme" :options="colorThemeOptions" />
    </InlineField>
    <InlineField label="Version" between>
      <span>{{ appVersion }}</span>
    </InlineField>
    <BakingConfigDialog
      v-model:open="showSelectActionDialogFlag"
      :actions="exportableActions"
      @execute="bakeAction"
    />
    <AnimatedSvgSettingDialog
      v-model:open="showAnimatedSvgSettingDialogFlag"
      :settings="settings.animationExportingSettings"
      @execute="exportAnimatedSvg"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useStorage } from '/@/composables/storage'
import { useAnimationStore } from '/@/store/animation'
import { useStore } from '/@/store'
import InlineField from '/@/components/atoms/InlineField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import ToggleRadioButtons from '/@/components/atoms/ToggleRadioButtons.vue'
import BakingConfigDialog from '/@/components/molecules/dialogs/BakingConfigDialog.vue'
import AnimatedSvgSettingDialog from '/@/components/molecules/dialogs/AnimatedSvgSettingDialog.vue'
import {
  AnimationExportingSettings,
  ColorTheme,
  useSettings,
} from '/@/composables/settings'

export default defineComponent({
  components: {
    InlineField,
    CheckboxInput,
    ToggleRadioButtons,
    BakingConfigDialog,
    AnimatedSvgSettingDialog,
  },
  emits: [],
  setup() {
    const storage = useStorage()
    const isInheritWeight = ref(true)

    const store = useStore()
    const animationStore = useAnimationStore()
    const showSelectActionDialogFlag = ref(false)
    const selectedActionIds = ref<string[]>([])

    const exportableActions = computed(() => {
      return animationStore.actions.value.filter((a) => {
        return store.lastSelectedArmature.value?.id === a.armatureId
      })
    })

    function bakeAction(actionIds: string[]) {
      showSelectActionDialogFlag.value = false
      selectedActionIds.value = actionIds
      storage.bakeAction(actionIds)
    }

    const showAnimatedSvgSettingDialogFlag = ref(false)
    const { settings } = useSettings()
    function exportAnimatedSvg(val: AnimationExportingSettings) {
      settings.animationExportingSettings = val
      storage.bakeAnimatedSvg()
      showAnimatedSvgSettingDialogFlag.value = false
    }

    const colorThemeOptions = [
      { value: 'auto', label: 'Auto' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ]
    const colorTheme = computed({
      get() {
        return settings.colorTheme
      },
      set(val: ColorTheme) {
        settings.colorTheme = val
      },
    })

    return {
      appVersion: process.env.APP_VERSION,

      fileSystemEnable: storage.fileSystemEnable,
      openFile: storage.loadProjectFile,
      saveProjectFile: storage.saveProjectFile,
      overrideProjectFile: storage.overrideProjectFile,

      isInheritWeight,
      importSvg() {
        storage.loadSvgFile(isInheritWeight.value)
      },
      exportSvg: storage.bakeSvg,

      bakeAction,
      exportableActions,
      showSelectActionDialogFlag,
      showSelectActionDialog: () => (showSelectActionDialogFlag.value = true),

      settings,
      showAnimatedSvgSettingDialogFlag,
      exportAnimatedSvg,
      showAnimatedSvgSettingDialog: () =>
        (showAnimatedSvgSettingDialogFlag.value = true),

      colorThemeOptions,
      colorTheme,
    }
  },
})
</script>

<style scoped>
h3 {
  margin-bottom: 10px;
  text-align: left;
}
.menu-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.menu-list > * {
  margin-bottom: 10px;
}
.menu-list > button {
  width: 100%;
  padding: 2px;
  border: solid 1px var(--weak-border);
  border-radius: 4px;
  font-size: 14px;
}
.menu-list > button:hover {
  background-color: var(--background-second);
}
</style>
