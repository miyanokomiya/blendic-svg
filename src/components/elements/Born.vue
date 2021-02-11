<template>
  <g stroke="black" :fill="fill" :transform="transform" :opacity="opacity">
    <path
      :d="d"
      @click.exact="click({ head: true, tail: true })"
      @click.shift.exact="shiftClick({ head: true, tail: true })"
    />
    <circle
      r="10"
      :cx="head.x"
      :cy="head.y"
      :fill="fillHead"
      @click.exact="click({ head: true, tail: false })"
      @click.shift.exact="shiftClick({ head: true, tail: false })"
    ></circle>
    <circle
      r="10"
      :cx="tail.x"
      :cy="tail.y"
      :fill="fillTail"
      @click.exact="click({ head: false, tail: true })"
      @click.shift.exact="shiftClick({ head: false, tail: true })"
    ></circle>
    <line
      v-if="parent"
      :x1="parent.tail.x"
      :y1="parent.tail.y"
      :x2="head.x"
      :y2="head.y"
      stroke-dasharray="2 2"
      class="view-only"
    />
    <text
      :x="(head.x + tail.x) / 2"
      :y="(head.y + tail.y) / 2"
      text-anchor="middle"
      >{{ born.name }}</text
    >
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { Born, BornSelectedState } from "../../models/index";
import { transform, d } from "../../utils/helpers";
import { IVec2, add, sub, multi, rotate } from "okageo";
import { useSettings } from "../../composables/settings";

function d1(head: IVec2, tail: IVec2, invert = false): IVec2 {
  return add(
    head,
    rotate(multi(sub(tail, head), 0.3), (Math.PI / 6) * (invert ? -1 : 1))
  );
}

export default defineComponent({
  props: {
    born: {
      type: Object as PropType<Born>,
      required: true,
    },
    parent: {
      type: Object as PropType<Born | undefined>,
      default: undefined,
    },
    opacity: { type: Number, default: 0.5 },
    selectedState: {
      type: Object as PropType<BornSelectedState>,
      default: () => ({ head: false, tail: false }),
    },
  },
  emits: ["select", "shift-select"],
  setup(props, { emit }) {
    const { settings } = useSettings();

    const head = computed(() => props.born.head);
    const tail = computed(() => props.born.tail);

    return {
      transform: computed(() => transform(props.born.transform)),
      head,
      tail,
      d: computed(() =>
        d(
          [
            head.value,
            d1(head.value, tail.value),
            tail.value,
            d1(head.value, tail.value, true),
          ],
          true
        )
      ),
      fill: computed(() =>
        props.selectedState.head && props.selectedState.tail
          ? settings.selectedColor
          : "#aaa"
      ),
      fillHead: computed(() =>
        props.selectedState.head ? settings.selectedColor : ""
      ),
      fillTail: computed(() =>
        props.selectedState.tail ? settings.selectedColor : ""
      ),
      click: (state: BornSelectedState) => emit("select", state),
      shiftClick: (state: BornSelectedState) => {
        if (state.head) {
          emit("shift-select", {
            ...props.selectedState,
            head: !props.selectedState.head,
          });
        } else if (state.tail) {
          emit("shift-select", {
            ...props.selectedState,
            tail: !props.selectedState.tail,
          });
        }
      },
    };
  },
});
</script>

<style lang="scss" scoped>
path {
  cursor: pointer;
}
circle {
  cursor: pointer;
}
.view-only {
  pointer-events: none;
}
</style>
