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
  <Transition>
    <div v-if="availableCommandList.length > 0" class="canvas-command">
      <ul>
        <li v-for="item in availableCommandList" :key="item.command">
          <span v-if="item.command" class="command">{{ item.command }}:</span>
          <span>{{ item.title }}</span>
        </li>
      </ul>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { CommandExam } from '/@/composables/modes/types'

withDefaults(
  defineProps<{
    availableCommandList?: CommandExam[]
  }>(),
  {
    availableCommandList: () => [],
  }
)
</script>

<style scoped>
.canvas-command {
  margin-top: 4px;
  text-align: left;
  font-size: 14px;
  pointer-events: none;
}
ul {
  list-style: none;
  display: flex;
  flex-direction: column;
}
li {
  display: flex;
  align-items: center;
}
.command {
  margin-right: 6px;
  min-width: 12px;
}
.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
