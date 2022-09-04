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
  <div class="animation-panel-root">
    <div class="top">
      <ToggleRadioButtons
        :model-value="canvasType"
        :options="canvasOptionSrc"
        @update:model-value="setCurrentCanvas"
      />
      <div class="select-action">
        <SelectField v-model="selectedActionId" :options="actionOptions" />
      </div>
      <input v-model="draftName" type="text" @change="changeActionName" />
      <div class="action-buttons">
        <button
          type="button"
          class="add-action"
          title="Add action"
          @click="addAction"
        >
          <AddIcon />
        </button>
        <button
          type="button"
          class="delete-action"
          title="Delete action"
          :disabled="!selectedActionId"
          @click="deleteAction"
        >
          <DeleteIcon />
        </button>
      </div>
      <AnimationController
        :playing="playing"
        @play="setPlaying('play')"
        @reverse="setPlaying('reverse')"
        @pause="setPlaying('pause')"
        @jump-start="jumpStartFrame"
        @jump-end="jumpEndFrame"
        @jump-next="jumpNextKey"
        @jump-prev="jumpPrevKey"
      />
      <div class="end-frame-field">
        <InlineField label="End">
          <SliderInput
            :model-value="endFrame"
            :min="0"
            integer
            class="slider"
            @update:model-value="setEndFrame"
          />
        </InlineField>
      </div>
    </div>
    <ResizableH
      class="middle"
      :initial-rate="0.15"
      storage-key="animation-label"
      dense
    >
      <template #left="{ size }">
        <TimelineCanvas
          class="label-canvas"
          :canvas="labelCanvas"
          canvas-type="label"
        >
          <template #default="{ scale, viewOrigin }">
            <g
              :transform="`translate(${viewOrigin.x}, ${viewOrigin.y}) scale(${scale})`"
            >
              <TimelineBones
                :target-list="selectedTargetSummaryList"
                :label-width="size + 1"
                :scroll-y="viewOrigin.y"
                :target-expanded-map="expandedMap"
                :target-top-map="targetTopMap"
                :props-state-map="visibledTargetPropsStateMap"
                :height="labelHeight"
                @toggle-target-expanded="toggleTargetExpanded"
                @select="selectTargetProp"
              />
            </g>
          </template>
        </TimelineCanvas>
      </template>
      <template #right>
        <ResizableH
          class="timeline-canvas-space"
          :initial-rate="0.8"
          storage-key="animation-timeline"
          dense
        >
          <template #left>
            <div class="timeline-canvas-inner">
              <TimelineCanvas
                v-if="canvasType === 'action'"
                :canvas="currentCanvas"
                canvas-type="action"
              >
                <template #default="p">
                  <g :transform="`translate(0, ${p.viewOrigin.y})`">
                    <TimelineAxis
                      :scale="p.scale"
                      :origin-x="p.viewOrigin.x"
                      :view-width="p.viewSize.width"
                      :current-frame="currentFrame"
                      :end-frame="endFrame"
                      :header-height="labelHeight"
                    >
                      <KeyframeGroup
                        :scale="p.scale"
                        :keyframe-map-by-frame="keyframeMapByFrame"
                        :target-list="selectedTargetSummaryList"
                        :target-ids="selectedTargetIdList"
                        :selected-keyframe-map="selectedKeyframeMap"
                        :scroll-y="p.viewOrigin.y"
                        :target-expanded-map="expandedMap"
                        :target-top-map="targetTopMap"
                        :height="labelHeight"
                      />
                    </TimelineAxis>
                  </g>
                </template>
              </TimelineCanvas>
              <TimelineCanvas
                v-else
                :canvas="currentCanvas"
                canvas-type="graph"
              >
                <template #default="p">
                  <g
                    v-if="canvasType === 'graph'"
                    :transform="`translate(${p.viewOrigin.x}, 0)`"
                  >
                    <GraphAxis
                      :scale="p.scale"
                      :origin-y="p.viewOrigin.y"
                      :view-width="p.viewSize.width"
                      :view-height="p.viewSize.height"
                    />
                  </g>
                  <g :transform="`translate(0, ${p.viewOrigin.y})`">
                    <TimelineAxis
                      :scale="p.scale"
                      :origin-x="p.viewOrigin.x"
                      :view-width="p.viewSize.width"
                      :current-frame="currentFrame"
                      :end-frame="endFrame"
                      :header-height="labelHeight"
                    >
                      <g :transform="`translate(0, ${-p.viewOrigin.y})`">
                        <GraphKeyframes
                          :keyframe-map-by-frame="keyframeMapByFrame"
                          :selected-keyframe-map="selectedKeyframeMap"
                          :color-map="keyframePointColorMap"
                          :props-state-map="visibledTargetPropsStateMap"
                        />
                      </g>
                    </TimelineAxis>
                  </g>
                </template>
              </TimelineCanvas>
            </div>
          </template>
          <template #right>
            <div class="graph-panel-space">
              <GraphPanel
                :keyframe="lastSelectedKeyframe"
                :selected-state="selectedKeyframeMap[lastSelectedKeyframe?.id]"
                @update="updateKeyframe"
              />
            </div>
          </template>
        </ResizableH>
      </template>
    </ResizableH>
  </div>
</template>

<script lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useStore } from '../store'
import { useAnimationStore } from '../store/animation'
import {
  getKeyframeMapByFrame,
  mergeKeyframesWithDropped,
} from '../utils/animations'
import { IVec2 } from 'okageo'
import { toList } from '/@/utils/commons'
import { useAnimationLoop } from '../composables/animationLoop'
import { useSvgCanvas } from '/@/composables/canvas'
import { KeyframeBase } from '/@/models/keyframe'
import { useBooleanMap } from '/@/composables/idMap'
import { Size } from 'okanvas'
import {
  getKeyframeBoneSummary,
  getKeyframeConstraintSummary,
  getTargetTopMap,
  KeyframeTargetSummary,
} from '/@/utils/helpers'
import { getKeyframeExistedPropsMap } from '/@/utils/keyframes'

const labelHeight = 24

type CanvasType = 'action' | 'graph'
const canvasOptionSrc: { label: string; value: CanvasType }[] = [
  { label: 'Action', value: 'action' },
  { label: 'Graph', value: 'graph' },
]

const keyframePointColorMap = {
  translateX: 'red',
  translateY: 'green',
  rotate: 'blue',
  scaleX: 'hotpink',
  scaleY: 'mediumaquamarine',
  influence: 'darkviolet',
}
</script>

<script setup lang="ts">
import SelectField from './atoms/SelectField.vue'
import TimelineCanvas from './TimelineCanvas.vue'
import TimelineAxis from './elements/atoms/TimelineAxis.vue'
import GraphAxis from './elements/atoms/GraphAxis.vue'
import TimelineBones from './elements/TimelineBones.vue'
import KeyframeGroup from './elements/KeyframeGroup.vue'
import GraphKeyframes from './elements/GraphKeyframes.vue'
import AnimationController from './molecules/AnimationController.vue'
import AddIcon from '/@/components/atoms/AddIcon.vue'
import DeleteIcon from '/@/components/atoms/DeleteIcon.vue'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import GraphPanel from '/@/components/panelContents/GraphPanel.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import ResizableH from '/@/components/atoms/ResizableH.vue'
import ToggleRadioButtons from '/@/components/atoms/ToggleRadioButtons.vue'

const store = useStore()
const animationStore = useAnimationStore()

const viewSize = ref<Size>({ width: 0, height: 0 })

const svgCanvasOptions = {
  scaleMin: 1,
  ignoreNegativeY: true,
  scaleAtFixY: true,
  viewOrigin: ref<IVec2>({ x: -20, y: 0 }),
  viewSize,
}

const labelCanvas = useSvgCanvas(svgCanvasOptions)
const keyframeCanvas = useSvgCanvas(svgCanvasOptions)
const graphCanvas = useSvgCanvas({
  scaleMin: 1,
  viewOrigin: ref<IVec2>({ x: -20, y: -50 }),
  viewSize,
})

const canvasType = ref<CanvasType>('action')
function setCurrentCanvas(val: unknown) {
  canvasType.value = val as CanvasType
}
const currentCanvas = computed(() => {
  switch (canvasType.value) {
    case 'action':
      return keyframeCanvas
    default:
      return graphCanvas
  }
})

const selectedAction = computed(() => animationStore.selectedAction.value)
const selectedAllBoneIdList = computed(() =>
  Object.keys(animationStore.selectedBoneIdMap.value)
)
const selectedAllBoneList = computed(() =>
  toList(animationStore.selectedBoneMap.value)
)
const selectedAllConstraintIdList = computed(() =>
  Object.keys(animationStore.selectedConstraintMap.value)
)
const selectedTargetIdList = computed(() =>
  selectedAllBoneIdList.value.concat(selectedAllConstraintIdList.value)
)
const selectedTargetSummaryList = computed<KeyframeTargetSummary[]>(() => {
  const keyframeMapByTargetId = animationStore.keyframeMapByTargetId.value
  const boneMap = animationStore.selectedBoneMap.value
  const constraintMap = animationStore.selectedConstraintMap.value
  return [
    ...selectedAllBoneList.value.map((b) =>
      getKeyframeBoneSummary(
        b,
        getKeyframeExistedPropsMap(keyframeMapByTargetId[b.id] ?? []).props
      )
    ),
    ...selectedAllConstraintIdList.value.map((id) => {
      const c = constraintMap[id]
      return getKeyframeConstraintSummary(
        boneMap[c.boneId],
        c,
        getKeyframeExistedPropsMap(keyframeMapByTargetId[id] ?? []).props
      )
    }),
  ]
})

const keyframeMapByFrame = computed(() => {
  const splited = animationStore.editedKeyframeMap.value
  if (!splited) {
    return getKeyframeMapByFrame(
      toList(animationStore.visibledKeyframeMap.value)
    )
  } else {
    return getKeyframeMapByFrame(
      mergeKeyframesWithDropped(
        // fixed keyframes
        toList({
          ...animationStore.visibledKeyframeMap.value,
          ...splited.notSelected,
        }),
        // moved keyframes
        toList(splited.selected),
        true
      ).merged
    )
  }
})

const draftName = ref('')
watchEffect(() => {
  draftName.value = selectedAction.value?.name ?? ''
})

const actionOptions = computed(() =>
  animationStore.actions.value.map((a) => {
    const valid = store.lastSelectedArmature.value?.id !== a.armatureId
    return {
      value: a.id,
      label: `${valid ? '(x)' : ''} ${a.name}`,
    }
  })
)

function changeActionName() {
  const allNames = animationStore.actions.value.map((a) => a.name)
  if (allNames.includes(draftName.value)) {
    draftName.value = selectedAction.value?.name ?? ''
  } else {
    animationStore.updateAction({ name: draftName.value })
  }
}

const selectedActionId = computed({
  get: () => selectedAction.value?.id ?? '',
  set: (id: string) => animationStore.selectAction(id),
})

const animationSeriesKey = ref<string>()
let animationLoop: ReturnType<typeof useAnimationLoop>
watchEffect(() => {
  animationLoop?.stop()
  if (animationStore.playing.value === 'pause') return

  animationSeriesKey.value = `play_${Date.now()}`
  animationLoop = useAnimationLoop(animationCallback, 60)
  animationLoop.begin()
})

function animationCallback(tickFrame: number) {
  animationStore.stepFrame(
    tickFrame,
    animationStore.playing.value === 'reverse',
    animationSeriesKey.value
  )
}

const keyframeExpandedMap = useBooleanMap(() =>
  Object.keys(store.boneMap.value).concat(
    Object.keys(store.constraintMap.value)
  )
)

const targetTopMap = computed(() => {
  return getTargetTopMap(
    selectedTargetSummaryList.value,
    keyframeExpandedMap.booleanMap.value,
    labelHeight,
    2
  )
})

const {
  playing,
  visibledTargetPropsStateMap,
  lastSelectedKeyframe,
  selectedKeyframeMap,
  currentFrame,
  setPlaying,
  jumpStartFrame,
  jumpEndFrame,
  jumpNextKey,
  jumpPrevKey,
  selectTargetProp,
  endFrame,
  setEndFrame,
} = animationStore

const addAction = () => animationStore.addAction()
const deleteAction = () => animationStore.deleteAction()

const expandedMap = keyframeExpandedMap.booleanMap
const toggleTargetExpanded = keyframeExpandedMap.toggle

function updateKeyframe(keyframe: KeyframeBase, seriesKey?: string) {
  animationStore.execUpdateKeyframes({ [keyframe.id]: keyframe }, seriesKey)
}
</script>

<style scoped>
.animation-panel-root {
  display: flex;
  flex-direction: column;
  align-items: left;
  height: 100%;
}
.top {
  margin-bottom: 4px;
  flex: 0;
  display: flex;
  align-items: center;
}
.top > * {
  margin-right: 8px;
}
.select-action {
  width: 160px;
}
.end-frame-field {
  margin: 0 0 0 auto;
}
.end-frame-field .slider {
  width: 80px;
}
.action-buttons {
  display: flex;
  align-items: center;
}
.action-buttons button {
  width: 20px;
  height: 20px;
}
.action-buttons button + button {
  margin-left: 4px;
}
.middle {
  flex: 1;
  min-height: 0; /* for flex grow */
}
.label-canvas {
  overflow: hidden;
}
.timeline-canvas-space {
  height: 100%;
}
.timeline-canvas-space .timeline-canvas-inner {
  height: 100%;
  position: relative;
}
.graph-panel-space {
  height: 100%;
  border: solid 1px var(--strong-border);
  overflow: auto;
}
</style>
