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
  <div class="field inline">
    <label v-if="label" :style="{ width: labelWidth }">{{ label }}</label>
    <div><slot /></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    label: {
      type: String,
      default: '',
    },
    labelWidth: {
      type: String,
      default: undefined,
    },
  },
})
</script>

<style lang="scss" scoped>
.field {
  width: 100%;
  & + .field {
    margin-top: 10px;
  }
  &.inline {
    display: flex;
    align-items: center;
    > label {
      margin-right: 10px;
      min-width: 60px;
      text-align: left;
    }
    > label + * {
      flex: 1;
      min-width: 50px; // a magic to fix flex width
    }
  }
}
</style>
