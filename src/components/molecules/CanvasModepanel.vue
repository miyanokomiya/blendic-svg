<template>
  <div class="cnavas-mode-panel">
    <button
      :class="{ selected: canvasMode === 'object' }"
      @click="changeMode('object')"
    >
      Object
    </button>
    <button
      :class="{ selected: canvasMode === 'pose' }"
      @click="changeMode('pose')"
    >
      Pose
    </button>
    <button
      :class="{ selected: canvasMode === 'edit' }"
      @click="changeMode('edit')"
    >
      Edit
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
    &.selected {
      background-color: #ddd;
    }
    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
