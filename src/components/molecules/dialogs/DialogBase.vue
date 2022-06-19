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
  <div v-if="open" class="dialog-wrapper">
    <div class="overlay" />
    <div class="body-outer" @click.self="close">
      <div class="body-innter">
        <button type="button" class="close-button" @click="close">
          <DeleteIcon fill="none" stroke="#888" />
        </button>
        <div class="body-content">
          <slot />
          <div v-if="$slots.buttons" class="buttons">
            <slot name="buttons" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DeleteIcon from '/@/components/atoms/DeleteIcon.vue'

export default defineComponent({
  components: { DeleteIcon },
  props: {
    open: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:open'],
  setup(_, { emit }) {
    return {
      close: () => emit('update:open', false),
    }
  },
})
</script>

<style lang="scss" scoped>
.dialog-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: #777;
  opacity: 0.2;
}
.body-outer {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.body-innter {
  position: relative;
  background-color: #fff;
  box-shadow: 0 3px 3px #aaa;
  border-radius: 4px;
  padding: 12px;
}
.body-content {
  min-width: 220px;
  max-width: 50%;
  min-height: 100px;
  max-height: 80%;
  overflow: auto;
}
.close-button {
  position: absolute;
  right: 0;
  top: 0;
  transform: translateY(-100%);
  width: 24px;
  height: 24px;
  outline: none;
}
.buttons {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  > :deep(*) {
    margin-left: 8px;
  }
}
</style>
