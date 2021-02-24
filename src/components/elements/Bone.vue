<template>
  <g
    stroke="black"
    :fill="fill"
    :transform="transform"
    :opacity="adjustedOpacity"
    :stroke-width="Math.min(2 * scale, 2)"
  >
    <g
      stroke-linejoin="bevel"
      @click.exact="click({ head: true, tail: true })"
      @click.shift.exact="shiftClick({ head: true, tail: true })"
    >
      <path :d="headPath" :fill="fillDark" />
      <path :d="tailPath" />
    </g>
    <circle
      :r="circleR"
      :cx="head.x"
      :cy="head.y"
      :fill="fillHead"
      @click.exact="click({ head: true, tail: false })"
      @click.shift.exact="shiftClick({ head: true, tail: false })"
    ></circle>
    <circle
      :r="circleR"
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
      :stroke-dasharray="`${2 * scale} ${2 * scale}`"
      class="view-only"
    />
    <text
      v-if="name"
      :x="(head.x + tail.x) / 2"
      :y="(head.y + tail.y) / 2"
      :font-size="Math.min(16 * scale, 16)"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="black"
      stroke="none"
      class="view-only"
      >{{ name }}</text
    >
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { Bone, BoneSelectedState } from '../../models/index'
import { transform, d } from '../../utils/helpers'
import { IVec2, add, sub, multi, rotate, getDistance } from 'okageo'
import { useSettings } from '../../composables/settings'

function d1(head: IVec2, tail: IVec2, invert = false): IVec2 {
  return add(
    head,
    rotate(multi(sub(tail, head), 0.15), (Math.PI / 4) * (invert ? -1 : 1))
  )
}

function getCircleR(head: IVec2, tail: IVec2): number {
  return getDistance(head, tail) * 0.04
}

export default defineComponent({
  props: {
    bone: {
      type: Object as PropType<Bone>,
      required: true,
    },
    parent: {
      type: Object as PropType<Bone | undefined>,
      default: undefined,
    },
    opacity: { type: Number, default: 1 },
    scale: { type: Number, default: 1 },
    selectedState: {
      type: Object as PropType<BoneSelectedState>,
      default: () => ({ head: false, tail: false }),
    },
    poseMode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['select', 'shift-select'],
  setup(props, { emit }) {
    const { settings } = useSettings()

    const head = computed(() => props.bone.head)
    const tail = computed(() => props.bone.tail)
    const side1 = computed(() => d1(head.value, tail.value))
    const side2 = computed(() => d1(head.value, tail.value, true))

    const selectedAll = computed(() => {
      if (props.poseMode) {
        return props.selectedState.head || props.selectedState.tail
      } else {
        return props.selectedState.head && props.selectedState.tail
      }
    })

    const circleR = computed(() => getCircleR(head.value, tail.value))

    return {
      adjustedOpacity: computed(() => props.opacity * settings.boneOpacity),
      name: computed(() => (settings.showBoneName ? props.bone.name : '')),
      circleR,
      transform: computed(() => transform(props.bone.transform)),
      head,
      tail,
      headPath: computed(() => d([head.value, side1.value, side2.value], true)),
      tailPath: computed(() => d([tail.value, side1.value, side2.value], true)),
      fill: computed(() =>
        selectedAll.value ? settings.selectedColor : '#ddd'
      ),
      fillDark: computed(() =>
        selectedAll.value ? settings.selectedColor : '#bbb'
      ),
      fillHead: computed(() =>
        props.selectedState.head ? settings.selectedColor : ''
      ),
      fillTail: computed(() =>
        props.selectedState.tail ? settings.selectedColor : ''
      ),
      click: (state: BoneSelectedState) => {
        if (props.poseMode) {
          emit('select', { head: true, tail: true })
        } else {
          emit('select', state)
        }
      },
      shiftClick: (state: BoneSelectedState) => {
        if (props.poseMode) {
          if (selectedAll.value) {
            emit('shift-select', { head: false, tail: false })
          } else {
            emit('shift-select', { head: true, tail: true })
          }
        } else {
          if (state.head && state.tail) {
            if (selectedAll.value) {
              emit('shift-select', { head: false, tail: false })
            } else {
              emit('shift-select', { head: true, tail: true })
            }
          } else if (state.head) {
            emit('shift-select', {
              ...props.selectedState,
              head: !props.selectedState.head,
            })
          } else if (state.tail) {
            emit('shift-select', {
              ...props.selectedState,
              tail: !props.selectedState.tail,
            })
          }
        }
      },
    }
  },
})
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
