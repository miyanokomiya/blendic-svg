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
  <g>
    <g v-for="(curve, i) in curves" :key="curve.k.id">
      <g :stroke="color" :stroke-width="scale" fill="none">
        <line
          v-if="i === 0"
          :x1="curve.from.x - 20000"
          :y1="curve.from.y"
          :x2="curve.from.x"
          :y2="curve.from.y"
          class="view-only"
        />
        <line
          v-if="i === curves.length - 1"
          :x1="curve.from.x"
          :y1="curve.from.y"
          :x2="curve.from.x + 20000"
          :y2="curve.from.y"
          class="view-only"
        />
        <template v-else>
          <CurveBezier3Vue
            v-if="curve.name === 'bezier3'"
            :c0="curve.from"
            :c1="curve.c1"
            :c2="curve.c2"
            :c3="curve.to"
            :color="color"
            :show-control="curve.selected"
            :scale="scale"
          />
          <g v-else-if="curve.name === 'constant'">
            <CurveConstant
              :from="curve.from"
              :to="curve.to"
              :color="color"
              :scale="scale"
              class="view-only"
            />
          </g>
          <line
            v-else
            :x1="curve.from.x"
            :y1="curve.from.y"
            :x2="curve.to.x"
            :y2="curve.to.y"
            :stroke-width="scale"
            class="view-only"
          />
        </template>
      </g>
    </g>
    <g>
      <g v-for="curve in curves" :key="curve.k.id">
        <title>{{ pointKey }}</title>
        <circle
          :cx="curve.from.x"
          :cy="curve.from.y"
          :r="5 * scale"
          stroke="#000"
          :stroke-width="scale"
          :fill="curve.selected ? selectedColor : color"
          @click.exact="select(curve.k)"
          @click.shift.exact="shiftSelect(curve.k)"
        />
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { IVec2 } from 'okageo'
import { computed, defineComponent, PropType } from 'vue'
import { IdMap } from '/@/models'
import {
  CurveBezier3,
  CurveName,
  KeyframeBase,
  KeyframePoint,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import { getFrameX } from '/@/utils/animations'
import { getNormalizedBezier3Points } from '/@/utils/keyframes/core'
import CurveBezier3Vue from '/@/components/elements/molecules/CurveBezier3.vue'
import CurveConstant from '/@/components/elements/molecules/CurveConstant.vue'
import { useSettings } from '/@/composables/settings'

type CurveInfo = {
  k: KeyframeBase
  name: CurveName
  from: IVec2
  selected: boolean
  to: IVec2
  c1?: IVec2
  c2?: IVec2
}

export default defineComponent({
  components: { CurveBezier3Vue, CurveConstant },
  props: {
    pointKey: {
      type: String,
      required: true,
    },
    keyFrames: {
      type: Array as PropType<KeyframeBase[]>,
      required: true,
    },
    selectedStateMap: {
      type: Object as PropType<IdMap<KeyframeSelectedState>>,
      default: () => ({}),
    },
    valueWidth: {
      type: Number,
      default: 1,
    },
    color: {
      type: String,
      default: '#fff',
    },
    scale: {
      type: Number,
      default: 1,
    },
  },
  emits: ['select', 'shift-select'],
  setup(props, { emit }) {
    function toPoint(p: KeyframePoint, frame: number): IVec2 {
      return {
        x: getFrameX(frame),
        y: p.value * props.valueWidth,
      }
    }

    const curves = computed(() => {
      const ret: CurveInfo[] = []
      props.keyFrames.forEach((k, i) => {
        const selectedState = props.selectedStateMap[k.id]
        const p = k.points[props.pointKey]
        const from = toPoint(p, k.frame)
        const base = {
          k,
          name: p.curve.name,
          selected: selectedState ? selectedState.props[props.pointKey] : false,
          from,
        }

        if (i === props.keyFrames.length - 1) {
          ret.push({ ...base, to: from })
        } else {
          const next = props.keyFrames[i + 1]
          const to = toPoint(next.points[props.pointKey], next.frame)
          if (p.curve.name === 'bezier3') {
            const curve = p.curve as CurveBezier3
            const list = getNormalizedBezier3Points(
              from,
              curve.c1,
              curve.c2,
              to
            )
            ret.push({ ...base, to, c1: list[1], c2: list[2] })
          } else {
            ret.push({ ...base, to })
          }
        }
      })
      return ret
    })

    function select(keyframe: KeyframeBase) {
      emit('select', keyframe.id, {
        name: keyframe.name,
        props: { [props.pointKey]: true },
      } as KeyframeSelectedState)
    }
    function shiftSelect(keyframe: KeyframeBase) {
      emit('shift-select', keyframe.id, {
        name: keyframe.name,
        props: { [props.pointKey]: true },
      } as KeyframeSelectedState)
    }

    const { settings } = useSettings()

    return {
      selectedColor: computed(() => settings.selectedColor),
      curves,
      select,
      shiftSelect,
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
