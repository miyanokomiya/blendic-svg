<template>
  <span class="select-root">
    <select v-model="value">
      <option value="">-- None --</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </span>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    options: {
      type: Array as PropType<{ value: number | string; label: string }[]>,
      default: () => [],
    },
    modelValue: {
      type: [Number, String],
      default: '',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return {
      value: computed({
        get() {
          return props.modelValue
        },
        set(val: number | string) {
          emit('update:modelValue', val)
        },
      }),
    }
  },
})
</script>

<style lang="scss" scoped>
.select-root {
  position: relative;
  display: flex;
  align-items: center;
  select {
    width: 100%;
    padding: 1px 12px 0 0;
    border: solid 1px #000;
  }
  &::after {
    display: block;
    content: ' ';
    position: absolute;
    top: 8px;
    right: 4px;
    width: 0;
    height: 0;
    pointer-events: none;
    border-top: solid 8px #000;
    border-left: solid 6px transparent;
    border-right: solid 6px transparent;
  }
}
</style>
