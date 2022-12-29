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
  <div class="animation-controller">
    <button type="button" title="jump to start" @click="emit('jump-start')">
      <JumpEndIcon flipped />
    </button>
    <button
      type="button"
      title="jump to prev keyframe"
      @click="emit('jump-prev')"
    >
      <JumpKeyIcon flipped />
    </button>
    <template v-if="playing !== 'pause'">
      <button
        type="button"
        title="pause"
        class="pause-button"
        @click="emit('pause')"
      >
        <PauseIcon />
      </button>
    </template>
    <template v-else>
      <button type="button" title="reverse" @click="emit('reverse')">
        <PlayIcon flipped />
      </button>
      <button type="button" title="play" @click="emit('play')">
        <PlayIcon />
      </button>
    </template>
    <button
      type="button"
      title="jump to next keyframe"
      @click="emit('jump-next')"
    >
      <JumpKeyIcon />
    </button>
    <button type="button" title="jump to end" @click="emit('jump-end')">
      <JumpEndIcon />
    </button>
  </div>
</template>

<script lang="ts" setup>
import PlayIcon from '/@/components/atoms/PlayIcon.vue'
import PauseIcon from '/@/components/atoms/PauseIcon.vue'
import JumpKeyIcon from '/@/components/atoms/JumpKeyIcon.vue'
import JumpEndIcon from '/@/components/atoms/JumpEndIcon.vue'
import { PlayState } from '/@/models'

withDefaults(
  defineProps<{
    playing?: PlayState
  }>(),
  {
    playing: 'pause',
  }
)

const emit = defineEmits<{
  (e: 'jump-end'): void
  (e: 'jump-start'): void
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'reverse'): void
  (e: 'jump-next'): void
  (e: 'jump-prev'): void
}>()
</script>

<style scoped>
.animation-controller {
  display: flex;
  align-items: center;
}
button {
  width: 20px;
  height: 20px;
  overflow: hidden;
}
button:first-child {
  border-radius: 4px 0 0 4px;
}
button:last-child {
  border-radius: 0 4px 4px 0;
}
button + button {
  margin-left: 2px;
}
button.pause-button {
  width: 42px;
}
</style>
