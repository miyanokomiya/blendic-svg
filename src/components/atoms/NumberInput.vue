<template>
  <input v-model="draftValue" type="text" @change="input" />
</template>

<script lang="ts">
import { computed, defineComponent, ref, watchEffect } from 'vue'

export default defineComponent({
  props: {
    modelValue: { type: Number, default: 0 },
    integer: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const draftValue = ref('0')

    watchEffect(() => {
      draftValue.value = props.modelValue.toString()
    })

    const parseDraftValue = computed(() => {
      if (props.integer) {
        return parseInt(draftValue.value)
      } else {
        return parseFloat(draftValue.value)
      }
    })

    return {
      draftValue,
      input() {
        if (parseDraftValue.value === props.modelValue) return
        emit('update:modelValue', parseDraftValue.value)
      },
    }
  },
})
</script>
