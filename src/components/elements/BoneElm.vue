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
    :stroke-width="strokeWidth"
  >
    <title>{{ bone.name }}</title>
    <g
      stroke-linejoin="bevel"
      :data-type="readOnly ? undefined : 'bone-body'"
      :data-id="readOnly ? undefined : bone.id"
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
      :data-type="readOnly ? undefined : 'bone-head'"
      :data-id="readOnly ? undefined : bone.id"
      @click="click($event, { head: true })"
    ></circle>
    <circle
      :r="circleR"
      :cx="tail.x"
      :cy="tail.y"
      :fill="fillTail"
      :data-type="readOnly ? undefined : 'bone-tail'"
      :data-id="readOnly ? undefined : bone.id"
      @click="click($event, { tail: true })"
    ></circle>
    <line
      v-if="parent"
      :x1="parent.tail.x"
      :y1="parent.tail.y"
      :x2="head.x"
      :y2="head.y"
      :stroke-dasharray="`${1.5 * scale} ${6 * scale}`"
      class="view-only stroke-text"
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
      <text class="fill-background stroke-background">{{ name }}</text>
      <text class="fill-text" stroke="none">{{ name }}</text>
    </g>
  </g>
</template>

<script lang="ts">
import { computed } from 'vue'
import { Bone, BoneSelectedState } from '../../models/index'
import { d } from '../../utils/helpers'
import { IVec2, add, sub, multi, rotate, getDistance } from 'okageo'
import { useSettings } from '../../composables/settings'
import { switchClick } from '/@/utils/devices'
import { SelectOptions } from '/@/composables/modes/types'

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
</script>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    bone: Bone
    parent?: Bone | undefined
    opacity?: number
    scale?: number
    selectedState?: BoneSelectedState
    poseMode?: boolean
    readOnly?: boolean
  }>(),
  {
    parent: undefined,
    opacity: 1,
    scale: 1,
    selectedState: () => ({}),
    poseMode: false,
    readOnly: false,
  }
)

const emit = defineEmits<{
  (e: 'select', state: BoneSelectedState, options?: SelectOptions): void
}>()

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

const circleR = computed(() => getCircleR(head.value, tail.value, props.scale))

const strokeWidth = computed(() => Math.min(1.2 * Math.min(props.scale, 1), 3))

const adjustedOpacity = computed(() => props.opacity * settings.boneOpacity)
const name = computed(() => (settings.showBoneName ? props.bone.name : ''))
const headPath = computed(() => d([head.value, side1.value, side2.value], true))
const tailPath = computed(() => d([tail.value, side1.value, side2.value], true))

const fill = computed(() =>
  selectedAll.value ? settings.selectedColor : '#ddd'
)

const fillDark = computed(() =>
  selectedAll.value ? settings.selectedColor : '#bbb'
)

const fillHead = computed(() =>
  props.selectedState.head ? settings.selectedColor : ''
)

const fillTail = computed(() =>
  props.selectedState.tail ? settings.selectedColor : ''
)

const click = (e: MouseEvent, state: BoneSelectedState) => {
  const stateForMode = props.poseMode
    ? ({ head: true, tail: true } as const)
    : state

  switchClick(e, {
    plain: () => emit('select', stateForMode),
    shift: () => emit('select', stateForMode, { shift: true }),
    ctrl: () => emit('select', stateForMode, { ctrl: true }),
  })
}
</script>

<style scoped>
path {
  cursor: pointer;
}
circle {
  cursor: pointer;
}
</style>
