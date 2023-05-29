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
        <h3>Select Actions</h3>
        <CheckboxInput
          v-for="action in actions"
          :key="action.id"
          v-model="selectedMap[action.id]"
          :label="action.name"
        />
      </template>
      <template #buttons>
        <DialogButton @click="updateOpen(false)">Cancel</DialogButton>
        <DialogButton
          type="primary"
          :disabled="selectedActionIds.length === 0"
          @click="execute"
          >Export</DialogButton
        >
      </template>
    </DialogBase>
  </teleport>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { Action } from '/@/models'
import { mapFilter, toMapFromString } from '/@/utils/commons'
</script>

<script setup lang="ts">
import DialogBase from '/@/components/molecules/dialogs/DialogBase.vue'
import DialogButton from '/@/components/atoms/DialogButton.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    actions: Pick<Action, 'id' | 'name'>[]
    initialActionIds?: string[]
  }>(),
  {
    initialActionIds: () => [],
  }
)

const emits = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'execute', actionIds: string[]): void
}>()

const selectedMap = ref(toMapFromString(props.initialActionIds, true))
const selectedActionIds = computed(() => {
  return props.actions.filter((a) => selectedMap.value[a.id]).map((a) => a.id)
})

function updateOpen(val: boolean) {
  emits('update:open', val)
}

function execute() {
  emits('execute', Object.keys(mapFilter(selectedMap.value, (v) => v)))
}
</script>
