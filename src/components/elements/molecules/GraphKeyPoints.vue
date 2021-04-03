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
    <g class="view-only">
      <GraphCurveLines :curves="curves" :color="color" :scale="scale" />
    </g>
    <g>
      <g v-for="curve in curves" :key="curve.id">
        <title>{{ pointKey }}</title>
        <circle
          :cx="curve.from.x"
          :cy="curve.from.y"
          :r="5 * scale"
          stroke="#000"
          :stroke-width="scale"
          :fill="curve.selected ? selectedColor : color"
          @click.exact="select(curve.id, curve.keyframeName)"
          @click.shift.exact="shiftSelect(curve.id, curve.keyframeName)"
        />
      </g>
    </g>
    <g>
      <g v-for="curve in curves" :key="curve.id">
        <BezierControls
          v-if="curve.selected"
          :c0="curve.from"
          :control-in="curve.controlIn"
          :control-out="curve.controlOut"
          :color="color"
          :scale="scale"
          @down-control-in="downControl(curve.id, { controlIn: true })"
          @down-control-out="downControl(curve.id, { controlOut: true })"
        >
        </BezierControls>
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { add, IVec2 } from 'okageo'
import { computed, defineComponent, inject, PropType } from 'vue'
import { IdMap } from '/@/models'
import {
  CurveName,
  CurveSelectedState,
  KeyframeBase,
  KeyframeName,
  KeyframePoint,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import { getFrameX } from '/@/utils/animations'
import {
  getNormalizedBezier3Points,
  getMonotonicBezier3Points,
} from '/@/utils/keyframes/core'
import BezierControls from '/@/components/elements/molecules/BezierControls.vue'
import GraphCurveLines from '/@/components/elements/molecules/GraphCurveLines.vue'
import { useSettings } from '/@/composables/settings'

type CurveInfo = {
  id: string
  keyframeName: KeyframeName
  name: CurveName
  selected: boolean
  order: 'first' | 'inner' | 'last'
  from: IVec2
  to: IVec2
  c1?: IVec2
  c2?: IVec2
  fixedC1?: IVec2
  fixedC2?: IVec2
  controlIn?: IVec2
  controlOut?: IVec2
}

function toPoint(p: KeyframePoint, frame: number, valueWidth: number): IVec2 {
  return {
    x: getFrameX(frame),
    y: p.value * valueWidth,
  }
}
function controlToPoint(c: IVec2, valueWidth: number): IVec2 {
  return {
    x: getFrameX(c.x),
    y: c.y * valueWidth,
  }
}

function createCurveInfo(
  index: number,
  point: KeyframePoint,
  base: CurveInfo,
  keyframes: KeyframeBase[],
  pointKey: string,
  valueWidth: number
): CurveInfo {
  if (index === keyframes.length - 1) {
    return { ...base, to: base.from }
  }

  const next = keyframes[index + 1]
  const to = toPoint(next.points[pointKey], next.frame, valueWidth)

  if (point.curve.name !== 'bezier3') {
    return { ...base, to }
  }

  const c1Base = controlToPoint(point.curve.controlOut, valueWidth)
  const c2Base = controlToPoint(
    next.points[pointKey].curve.controlIn,
    valueWidth
  )
  const [, c1, c2] = getNormalizedBezier3Points(base.from, c1Base, c2Base, to)
  const [, fixedC1, fixedC2] = getMonotonicBezier3Points(
    base.from,
    c1Base,
    c2Base,
    to
  )

  return {
    ...base,
    to,
    c1,
    c2,
    fixedC1,
    fixedC2,
    controlOut: c1,
  }
}

function getCurves(args: {
  keyframes: KeyframeBase[]
  selectedStateMap: IdMap<KeyframeSelectedState>
  pointKey: string
  valueWidth: number
}): IdMap<CurveInfo> {
  const length = args.keyframes.length
  const idMap: { [id: string]: boolean } = {}
  let before: CurveInfo | undefined = undefined

  return args.keyframes.reduce<IdMap<CurveInfo>>((ret, k, i) => {
    const selectedState = args.selectedStateMap[k.id]
    const p = k.points[args.pointKey]
    const from = toPoint(p, k.frame, args.valueWidth)

    const controlIn =
      before?.name === 'bezier3'
        ? add(controlToPoint(p.curve.controlIn, args.valueWidth), from)
        : undefined

    idMap[k.id] = true

    const curve = createCurveInfo(
      i,
      p,
      {
        id: k.id,
        keyframeName: k.name,
        name: p.curve.name,
        selected: selectedState ? selectedState.props[args.pointKey] : false,
        order: i === 0 ? 'first' : i === length - 1 ? 'last' : 'inner',
        from,
        to: from,
        controlIn,
      },
      args.keyframes,
      args.pointKey,
      args.valueWidth
    )

    before = curve
    ret[curve.id] = curve

    return ret
  }, {})
}

export default defineComponent({
  components: {
    BezierControls,
    GraphCurveLines,
  },
  props: {
    pointKey: {
      type: String,
      required: true,
    },
    keyframes: {
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
  },
  emits: ['select', 'shift-select', 'down-control'],
  setup(props, { emit }) {
    const curves = computed(() =>
      getCurves({
        keyframes: props.keyframes,
        selectedStateMap: props.selectedStateMap,
        pointKey: props.pointKey,
        valueWidth: props.valueWidth,
      })
    )

    function select(id: string, keyframeName: KeyframeName) {
      emit('select', id, {
        name: keyframeName,
        props: { [props.pointKey]: true },
      } as KeyframeSelectedState)
    }
    function shiftSelect(id: string, keyframeName: KeyframeName) {
      emit('shift-select', id, {
        name: keyframeName,
        props: { [props.pointKey]: true },
      } as KeyframeSelectedState)
    }

    function downControl(keyframeId: string, state: CurveSelectedState) {
      emit('down-control', keyframeId, props.pointKey, state)
    }

    const { settings } = useSettings()

    return {
      scale: inject<number>('scale', 1),
      selectedColor: computed(() => settings.selectedColor),
      curves,
      select,
      shiftSelect,
      downControl,
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
