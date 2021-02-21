<template>
  <g>
    <rect :width="labelWidth" height="10000" stroke="none" fill="#fff" />
    <line :x1="labelWidth" y1="0" :x2="labelWidth" y2="10000" stroke="black" />
    <g :transform="`translate(0, ${-scrollY})`">
      <TimelineRow
        v-for="(born, i) in selectedAllBornList"
        :key="born.id"
        :index="i + 2"
        :label-width="labelWidth"
        :label="born.name"
      />
    </g>
    <TimelineRow :index="0" :label-width="labelWidth" label="" />
    <TimelineRow :index="1" :label-width="labelWidth" label="Summary" />
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Born } from '/@/models'
import TimelineRow from './atoms/TimelineRow.vue'

export default defineComponent({
  components: {
    TimelineRow,
  },
  props: {
    selectedAllBornList: {
      type: Array as PropType<Born[]>,
      default: () => [],
    },
    labelWidth: {
      type: Number,
      default: 200,
    },
    scrollY: {
      type: Number,
      default: 0,
    },
  },
})
</script>
