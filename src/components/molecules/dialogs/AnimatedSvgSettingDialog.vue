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

Copyright (C) 2022, Tomoya Komiyama.
-->

<template>
  <teleport to="body">
    <DialogBase :open="open" @update:open="updateOpen">
      <template #default>
        <div class="content">
          <h3>Animation Settings</h3>
          <InlineField label="FPS" between>
            <ToggleRadioButtons
              v-model="draftSettings.fps"
              :options="fpsOptions"
            />
          </InlineField>
          <InlineField label="Range" between>
            <ToggleRadioButtons
              v-model="draftSettings.range"
              :options="autoCustomOptions"
            />
          </InlineField>
          <InlineField label="Custom Range" between>
            <SliderInput
              v-model="draftSettings.customRange.from"
              :min="0"
              :disabled="draftSettings.range !== 'custom'"
              class="inline-slider"
            />
            <span class="slider-between">to</span>
            <SliderInput
              v-model="draftSettings.customRange.to"
              :min="0"
              :disabled="draftSettings.range !== 'custom'"
              class="inline-slider"
            />
          </InlineField>
          <InlineField label="Size" between>
            <ToggleRadioButtons
              v-model="draftSettings.size"
              :options="autoCustomOptions"
            />
          </InlineField>
          <InlineField label="Custom Size" between>
            <SliderInput
              v-model="draftSettings.customSize.width"
              :min="0"
              :disabled="draftSettings.size !== 'custom'"
              class="inline-slider"
            />
            <span class="slider-between">x</span>
            <SliderInput
              v-model="draftSettings.customSize.width"
              :min="0"
              :disabled="draftSettings.size !== 'custom'"
              class="inline-slider"
            />
          </InlineField>
        </div>
      </template>
      <template #buttons>
        <DialogButton @click="updateOpen(false)">Cancel</DialogButton>
        <DialogButton type="primary" @click="execute">Export</DialogButton>
      </template>
    </DialogBase>
  </teleport>
</template>

<script lang="ts">
import { ref } from 'vue'
import { AnimationExportingSettings } from '/@/composables/settings'
</script>

<script setup lang="ts">
import DialogBase from '/@/components/molecules/dialogs/DialogBase.vue'
import DialogButton from '/@/components/atoms/DialogButton.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import ToggleRadioButtons from '/@/components/atoms/ToggleRadioButtons.vue'
import SliderInput from '/@/components/atoms/SliderInput.vue'

const props = defineProps<{
  open: boolean
  settings: AnimationExportingSettings
}>()

const draftSettings = ref<AnimationExportingSettings>({
  ...props.settings,
  customRange: { ...props.settings.customRange },
  customSize: { ...props.settings.customSize },
})

const emits = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'execute', settings: AnimationExportingSettings): void
}>()

const fpsOptions = [20, 30, 60].map((value) => ({
  value,
  label: `${value}`,
}))

const autoCustomOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 'custom', label: 'Custom' },
]

function updateOpen(val: boolean) {
  emits('update:open', val)
}

function execute() {
  emits('execute', draftSettings.value)
}
</script>

<style scoped>
.content {
  width: 300px;
}
h3 {
  margin-bottom: 16px;
}
.inline-slider {
  width: 60px;
}
.slider-between {
  margin: 0 10px;
}
</style>
