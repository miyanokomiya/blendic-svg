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
      <div class="field">
        <CheckboxInput v-model="settings.showBoneName" label="Bone Name" />
      </div>
      <div class="field break">
        <label>Bone Opacity</label>
        <input
          v-model="settings.boneOpacity"
          type="range"
          min="0"
          max="1"
          step="0.1"
        />
      </div>
      <div class="field">
        <CheckboxInput v-model="settings.showViewbox" label="Viewbox" />
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useSettings } from '/@/composables/settings'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'

export default defineComponent({
  components: { CheckboxInput },
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
form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .field {
    margin-bottom: 8px;
    width: 100%;
    display: flex;
    &:last-child {
      margin-bottom: 0;
    }
    &.break {
      flex-direction: column;
      align-items: flex-start;
      > label {
        margin-bottom: 6px;
      }
    }
  }
  input[type='range'] {
    width: 100%;
  }
}
</style>
