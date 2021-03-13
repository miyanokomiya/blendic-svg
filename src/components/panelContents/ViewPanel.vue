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
  <div class="view-panel">
    <h4>View</h4>
    <form>
      <InlineField>
        <CheckboxInput v-model="settings.showBoneName" label="Bone Name" />
      </InlineField>
      <BlockField label="Bone Opacity">
        <input
          v-model="settings.boneOpacity"
          type="range"
          min="0"
          max="1"
          step="0.1"
        />
      </BlockField>
      <InlineField>
        <CheckboxInput v-model="settings.showViewbox" label="Viewbox" />
      </InlineField>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useSettings } from '/@/composables/settings'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import BlockField from '/@/components/atoms/BlockField.vue'

export default defineComponent({
  components: { CheckboxInput, InlineField, BlockField },
  setup() {
    const { settings } = useSettings()

    return {
      settings,
    }
  },
})
</script>

<style lang="scss" scoped>
.view-panel {
  text-align: left;
}
h4 {
  margin-bottom: 8px;
}
</style>
