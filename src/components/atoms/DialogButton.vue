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
  <button type="button" :class="{ [type]: true }"><slot /></button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    type: {
      type: String as PropType<'default' | 'primary'>,
      default: 'default',
    },
  },
})
</script>

<style lang="scss" scoped>
button {
  padding: 4px 10px;
  border: solid 1px #ccc;
  border-radius: 4px;
  font-size: 14px;
  &:hover {
    opacity: 0.7;
  }
}
.primary {
  background-color: #4169e1;
  color: #fff;
}
</style>
