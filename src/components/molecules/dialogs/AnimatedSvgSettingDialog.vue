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
        <h3>Animation Settings</h3>
        <div class="content">
          <div class="settings">
            <InlineField label="FPS" between>
              <ToggleRadioButtons
                v-model="draftSettings.fps"
                :options="fpsOptions"
              />
            </InlineField>
            <InlineField label="FPS(Custom)" between>
              <SliderInput
                v-model="draftSettings.fps"
                :min="1"
                :max="60"
                integer
                class="inline-slider"
              />
            </InlineField>
            <InlineField label="Interpolation" between>
              <ToggleRadioButtons
                v-model="draftSettings.interpolation"
                :options="interpolationOptions"
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
            <InlineField label="Duration" between>
              <ToggleRadioButtons
                v-model="draftSettings.duration"
                :options="autoCustomOptions"
              />
            </InlineField>
            <InlineField label="Custom Duration (s)" between>
              <SliderInput
                v-model="customDuration"
                :min="0"
                :step="0.1"
                :disabled="draftSettings.duration !== 'custom'"
                class="inline-slider"
              />
            </InlineField>
            <InlineField label="Size" between>
              <ToggleRadioButtons
                v-model="draftSettings.size"
                :options="autoCustomOptions"
              />
            </InlineField>
            <InlineField label="Custom Size (px)" between>
              <SliderInput
                v-model="draftSettings.customSize.width"
                :min="0"
                :disabled="draftSettings.size !== 'custom'"
                class="inline-slider"
              />
              <span class="slider-between">x</span>
              <SliderInput
                v-model="draftSettings.customSize.height"
                :min="0"
                :disabled="draftSettings.size !== 'custom'"
                class="inline-slider"
              />
            </InlineField>
          </div>
          <div class="preview">
            <div>
              <DialogButton @click="updatePreview">{{
                previewSrc ? 'Reset' : 'Preview'
              }}</DialogButton>
            </div>
            <div class="preview-outer">
              <img v-if="previewSrc" :src="previewSrc.src" alt="Preview" />
              <p v-else>None</p>
            </div>
            <p>
              <span>Size(b): </span>
              <span>{{
                previewSrc ? previewSrc.size.toLocaleString() : '-'
              }}</span>
            </p>
          </div>
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
import { ref, computed, watch } from 'vue'
import { AnimationExportingSettings } from '/@/composables/settings'
import { useStorage } from '/@/composables/storage'

const storage = useStorage()
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

const fpsOptions = [5, 10, 20, 30, 60].map((value) => ({
  value,
  label: `${value}`,
}))

const interpolationOptions = [
  { value: 'discrete', label: 'Discrete' },
  { value: 'linear', label: 'Linear' },
]

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

const customDuration = computed({
  get() {
    return draftSettings.value.customDuration / 1000
  },
  set(val: number) {
    draftSettings.value.customDuration = val * 1000
  },
})

const previewSrc = ref<{ src: string; size: number }>()
function updatePreview() {
  const svg = storage.bakeAnimatedSvg(draftSettings.value)
  if (!svg) return

  const text = new XMLSerializer().serializeToString(svg)
  previewSrc.value = {
    src:
      'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(text))),
    size: new Blob([text]).size,
  }
}

watch(
  () => props.open,
  () => {
    previewSrc.value = undefined
  }
)
</script>

<style scoped>
h3 {
  margin-bottom: 16px;
}
.content {
  display: flex;
  justify-content: center;
  gap: 16px;
}
.settings {
  width: 350px;
}
.inline-slider {
  width: 60px;
}
.slider-between {
  margin: 0 10px;
}
.preview {
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
}
.preview-outer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 280px;
  height: 280px;
  border: 1px solid var(--strong-border);
}
.preview-outer img {
  width: 100%;
  height: 100%;
}
</style>
