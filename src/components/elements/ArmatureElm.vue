<template>
  <g stroke="black" :transform="transform" :opacity="opacity">
    <BoneElm
      v-for="bone in armature.bones"
      :key="bone.name"
      :bone="bone"
      :selected-state="boneSelectedState"
      :parent="boneMap[bone.parentId]"
      :scale="scale"
      @select="click"
      @shift-select="shiftClick"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { Armature, toMap } from '/@/models/index'
import { getTnansformStr } from '/@/utils/helpers'
import BoneElm from '/@/components/elements/Bone.vue'

export default defineComponent({
  components: { BoneElm },
  props: {
    armature: {
      type: Object as PropType<Armature>,
      required: true,
    },
    opacity: { type: Number, default: 0.8 },
    scale: { type: Number, default: 1 },
    selected: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['select', 'shift-select'],
  setup(props, { emit }) {
    return {
      boneMap: computed(() => toMap(props.armature.bones)),
      transform: computed(() => getTnansformStr(props.armature.transform)),
      boneSelectedState: computed(() =>
        props.selected ? { head: true, tail: true } : undefined
      ),
      click: () => emit('select', !props.selected),
      shiftClick: () => emit('shift-select', !props.selected),
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
