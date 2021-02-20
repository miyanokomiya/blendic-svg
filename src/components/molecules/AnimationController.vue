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
        title="reverse"
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

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import PlayIcon from '/@/components/atoms/PlayIcon.vue'
import PauseIcon from '/@/components/atoms/PauseIcon.vue'
import JumpKeyIcon from '/@/components/atoms/JumpKeyIcon.vue'
import JumpEndIcon from '/@/components/atoms/JumpEndIcon.vue'
import { PlayState } from '/@/models'

export default defineComponent({
  components: { PlayIcon, PauseIcon, JumpKeyIcon, JumpEndIcon },
  props: {
    playing: {
      type: String as PropType<PlayState>,
      default: 'pause',
    },
  },
  emits: [
    'jump-end',
    'jump-start',
    'play',
    'pause',
    'reverse',
    'jump-next',
    'jump-prev',
  ],
  setup(_props, { emit }) {
    return { emit }
  },
})
</script>

<style lang="scss" scoped>
.animation-controller {
  display: flex;
  align-items: center;
}
button {
  width: 20px;
  height: 20px;
  overflow: hidden;
  &:first-child {
    border-radius: 4px 0 0 4px;
  }
  &:last-child {
    border-radius: 0 4px 4px 0;
  }
  & + button {
    margin-left: 2px;
  }
  &.pause-button {
    width: 42px;
  }
}
</style>
