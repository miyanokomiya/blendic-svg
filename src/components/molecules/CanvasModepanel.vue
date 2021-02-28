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
  <div class="cnavas-mode-panel">
    <button
      :class="{ selected: canvasMode === 'object' }"
      @click="changeMode('object')"
    >
      Object
    </button>
    <button
      :class="{ selected: canvasMode === 'edit' }"
      @click="changeMode('edit')"
    >
      Edit
    </button>
    <button
      :class="{ selected: canvasMode === 'pose' }"
      @click="changeMode('pose')"
    >
      Pose
    </button>
    <button
      :class="{ selected: canvasMode === 'weight' }"
      @click="changeMode('weight')"
    >
      Weight
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { CanvasMode } from '/@/models'

export default defineComponent({
  props: {
    canvasMode: {
      type: String as PropType<CanvasMode>,
      required: true,
    },
  },
  emits: ['change-mode'],
  setup(_, { emit }) {
    return {
      changeMode(canvasMode: CanvasMode) {
        emit('change-mode', canvasMode)
      },
    }
  },
})
</script>

<style lang="scss" scoped>
.cnavas-mode-panel {
  > button {
    margin-right: 4px;
    width: 70px;
    padding: 2px;
    border: solid 1px #777;
    border-radius: 4px;
    font-size: 12px;
    background-color: #fff;
    &.selected {
      background-color: #ddd;
    }
    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
