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
  <DropdownMenu label="Armature" :items="items" @select="select" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DropdownMenu from '/@/components/molecules/DropdownMenu.vue'

export default defineComponent({
  components: { DropdownMenu },
  emits: ['symmetrize', 'delete'],
  setup(_, { emit }) {
    const items = [
      { value: 'symmetrize', label: 'Symmetrize', underline: true },
      { value: 'delete', label: 'Delete' },
    ]

    return {
      items,
      select(action: 'symmetrize' | 'delete') {
        emit(action)
      },
    }
  },
})
</script>
