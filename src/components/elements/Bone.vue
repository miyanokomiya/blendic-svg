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
  <g
    stroke="black"
    :fill="fill"
    :opacity="adjustedOpacity"
    :stroke-width="1.2 * Math.min(scale, 1)"
    :title="bone.name"
  >
    <g
      stroke-linejoin="bevel"
      @click="click($event, { head: true, tail: true })"
    >
      <path :d="headPath" :fill="fillDark" />
      <path :d="tailPath" />
    </g>
    <circle
      :r="circleR"
      :cx="head.x"
      :cy="head.y"
      :fill="fillHead"
      @click="click($event, { head: true, tail: false })"
    ></circle>
    <circle
      :r="circleR"
      :cx="tail.x"
      :cy="tail.y"
      :fill="fillTail"
      @click="click($event, { head: false, tail: true })"
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
    <g
      v-if="name"
      :transform="`translate(${(head.x + tail.x) / 2}, ${
        (head.y + tail.y) / 2
      })`"
      :font-size="Math.min(16 * scale, 16)"
      text-anchor="middle"
      dominant-baseline="middle"
      class="view-only"
    >
      <text fill="#fff" stroke="#fff">{{ name }}</text>
      <text fill="#000" stroke="none">{{ name }}</text>
    </g>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { Bone, BoneSelectedState } from '../../models/index'
import { d } from '../../utils/helpers'
import { IVec2, add, sub, multi, rotate, getDistance } from 'okageo'
import { useSettings } from '../../composables/settings'
import { switchClick } from '/@/utils/devices'
import { getShiftClickedBoneState } from '/@/utils/armatures'

function d1(head: IVec2, tail: IVec2, scaleX: number, invert = false): IVec2 {
  const v = multi(sub(tail, head), 0.15)
  const origin = add(head, v)
  return add(
    origin,
    multi(rotate(multi(v, 0.6), (Math.PI / 2) * (invert ? -1 : 1)), scaleX)
  )
}

function getCircleR(head: IVec2, tail: IVec2, scale: number): number {
  // keep minimal scaled anchor to select
  return Math.max(getDistance(head, tail) * 0.04, 2 * scale)
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
  emits: ['select'],
  setup(props, { emit }) {
    const { settings } = useSettings()

    const head = computed(() => {
      return props.bone.head
    })
    const tail = computed(() => {
      return props.bone.tail
    })
    const side1 = computed(() =>
      d1(head.value, tail.value, props.bone.transform.scale.x)
    )
    const side2 = computed(() =>
      d1(head.value, tail.value, props.bone.transform.scale.x, true)
    )

    const selectedAll = computed(() => {
      if (props.poseMode) {
        return props.selectedState.head || props.selectedState.tail
      } else {
        return props.selectedState.head && props.selectedState.tail
      }
    })

    const circleR = computed(() =>
      getCircleR(head.value, tail.value, props.scale)
    )

    function emitShiftClick(state: BoneSelectedState) {
      emit('select', state, { shift: true })
    }

    return {
      adjustedOpacity: computed(() => props.opacity * settings.boneOpacity),
      name: computed(() => (settings.showBoneName ? props.bone.name : '')),
      circleR,
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
      click: (e: MouseEvent, state: BoneSelectedState) => {
        if (props.poseMode) {
          switchClick(e, {
            plain: () => emit('select', { head: true, tail: true }),
            shift: () =>
              emitShiftClick(
                selectedAll.value
                  ? { head: false, tail: false }
                  : { head: true, tail: true }
              ),
            ctrl: () =>
              emit('select', { head: true, tail: true }, { ctrl: true }),
          })
        } else {
          switchClick(e, {
            plain: () => emit('select', state),
            shift: () =>
              emitShiftClick(
                getShiftClickedBoneState(props.selectedState, state)
              ),
            ctrl: () => emit('select', state, { ctrl: true }),
          })
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
