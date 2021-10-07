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
      <div class="select-canvas">
        <SelectField
          :model-value="canvasType"
          :options="canvasOptions"
          no-placeholder
          @update:modelValue="setCurrentCanvas"
        />
      </div>
      <div class="select-action">
        <SelectField v-model="selectedActionId" :options="actionOptions" />
      </div>
      <input v-model="draftName" type="text" @change="changeActionName" />
      <div class="action-buttons">
        <button class="add-action" title="Add action" @click="addAction">
          <AddIcon />
        </button>
        <button
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
            @update:modelValue="updateEndFrame"
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
        <TimelineCanvas class="label-canvas" :canvas="labelCanvas" :mode="mode">
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
                :props-state-map="propsStateMap"
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
              <TimelineCanvas :canvas="currentCanvas" :mode="mode">
                <template #default="{ scale, viewOrigin, viewSize }">
                  <g
                    v-if="canvasType === 'graph'"
                    :transform="`translate(${viewOrigin.x}, 0)`"
                  >
                    <GraphAxis
                      :scale="scale"
                      :origin-y="viewOrigin.y"
                      :view-width="viewSize.width"
                      :view-height="viewSize.height"
                    />
                  </g>
                  <g :transform="`translate(0, ${viewOrigin.y})`">
                    <TimelineAxis
                      :scale="scale"
                      :origin-x="viewOrigin.x"
                      :view-width="viewSize.width"
                      :current-frame="currentFrame"
                      :end-frame="endFrame"
                      :header-height="labelHeight"
                      @down-current-frame="downCurrentFrame"
                    >
                      <Keyframes
                        v-if="canvasType === 'action'"
                        :scale="scale"
                        :keyframe-map-by-frame="keyframeMapByFrame"
                        :target-list="selectedTargetSummaryList"
                        :target-ids="selectedTargetIdList"
                        :selected-keyframe-map="selectedKeyframeMap"
                        :scroll-y="viewOrigin.y"
                        :target-expanded-map="expandedMap"
                        :target-top-map="targetTopMap"
                        :height="labelHeight"
                        @select="selectKeyframe"
                        @shift-select="shiftSelectKeyframe"
                        @select-frame="selectKeyframeByFrame"
                        @shift-select-frame="shiftSelectKeyframeByFrame"
                      />
                      <g v-else :transform="`translate(0, ${-viewOrigin.y})`">
                        <GraphKeyframes
                          :keyframe-map-by-frame="keyframeMapByFrame"
                          :selected-keyframe-map="selectedKeyframeMap"
                          :color-map="keyframePointColorMap"
                          :props-state-map="propsStateMap"
                          @select="selectKeyframe"
                          @shift-select="shiftSelectKeyframe"
                          @down-control="grabControl"
                        />
                      </g>
                    </TimelineAxis>
                  </g>
                </template>
              </TimelineCanvas>
              <CommandExamPanel
                class="command-exam-panel"
                :available-command-list="availableCommandList"
              />
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
import { computed, defineComponent, Ref, ref, watchEffect } from 'vue'
import { useStore } from '../store'
import { useAnimationStore } from '../store/animation'
import SelectField from './atoms/SelectField.vue'
import TimelineCanvas from './TimelineCanvas.vue'
import TimelineAxis from './elements/atoms/TimelineAxis.vue'
import GraphAxis from './elements/atoms/GraphAxis.vue'
import TimelineBones from './elements/TimelineBones.vue'
import Keyframes from './elements/Keyframes.vue'
import GraphKeyframes from './elements/GraphKeyframes.vue'
import AnimationController from './molecules/AnimationController.vue'
import AddIcon from '/@/components/atoms/AddIcon.vue'
import DeleteIcon from '/@/components/atoms/DeleteIcon.vue'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import CommandExamPanel from '/@/components/molecules/CommandExamPanel.vue'
import GraphPanel from '/@/components/panelContents/GraphPanel.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import {
  getKeyframeMapByFrame,
  mergeKeyframesWithDropped,
} from '../utils/animations'
import { IVec2 } from 'okageo'
import { toList } from '/@/utils/commons'
import { useAnimationLoop } from '../composables/animationLoop'
import { useKeyframeEditMode } from '../composables/modes/keyframeEditMode'
import ResizableH from '/@/components/atoms/ResizableH.vue'
import { useCanvas } from '/@/composables/canvas'
import {
  CurveSelectedState,
  KeyframeBase,
  KeyframeSelectedState,
} from '/@/models/keyframe'
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
const canvasOptions: { label: string; value: CanvasType }[] = [
  { label: 'Action', value: 'action' },
  { label: 'Graph', value: 'graph' },
]

function useCanvasList() {
  const canvasType = ref<CanvasType>('action')
  function setCanvas(val: CanvasType) {
    canvasType.value = val
  }
  return {
    canvasType,
    setCanvas,
    canvasOptions: computed(() => canvasOptions),
  }
}

function useCanvasMode(canvasType: Ref<CanvasType>) {
  const mode = computed(() => {
    switch (canvasType.value) {
      case 'action':
        return useKeyframeEditMode('action')
      default:
        return useKeyframeEditMode('graph')
    }
  })

  return {
    mode,
    handlers: {
      downCurrentFrame() {
        mode.value.grabCurrentFrame()
      },
      selectKeyframe(id: string, selectedState: KeyframeSelectedState) {
        mode.value.select(id, selectedState)
      },
      shiftSelectKeyframe(id: string, selectedState: KeyframeSelectedState) {
        mode.value.shiftSelect(id, selectedState)
      },
      selectKeyframeByFrame(frame: number) {
        mode.value.selectFrame(frame)
      },
      shiftSelectKeyframeByFrame(frame: number) {
        mode.value.shiftSelectFrame(frame)
      },
      grabControl(
        keyframeId: string,
        pointKey: string,
        controls: CurveSelectedState
      ) {
        mode.value.grabControl(keyframeId, pointKey, controls)
      },
    },
  }
}

const keyframePointColorMap = {
  translateX: 'red',
  translateY: 'green',
  rotate: 'blue',
  scaleX: 'hotpink',
  scaleY: 'mediumaquamarine',
  influence: 'darkviolet',
}

export default defineComponent({
  components: {
    SelectField,
    TimelineCanvas,
    TimelineAxis,
    GraphAxis,
    TimelineBones,
    Keyframes,
    GraphKeyframes,
    AnimationController,
    SliderInput,
    CommandExamPanel,
    GraphPanel,
    AddIcon,
    DeleteIcon,
    InlineField,
    ResizableH,
  },
  setup() {
    const store = useStore()
    const animationStore = useAnimationStore()

    const viewSize = ref<Size>({ width: 0, height: 0 })
    const canvasOptions = {
      scaleMin: 1,
      ignoreNegativeY: true,
      scaleAtFixY: true,
      viewOrigin: ref<IVec2>({ x: -20, y: 0 }),
      viewSize,
    }
    const labelCanvas = useCanvas(canvasOptions)
    const keyframeCanvas = useCanvas(canvasOptions)
    const graphCanvas = useCanvas({
      scaleMin: 1,
      viewOrigin: ref<IVec2>({ x: -20, y: -50 }),
      viewSize,
    })

    const canvasList = useCanvasList()
    const canvasMode = useCanvasMode(canvasList.canvasType)

    const currentCanvas = computed(() => {
      switch (canvasList.canvasType.value) {
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
      const splited = canvasMode.mode.value.editedKeyframeMap.value
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

    return {
      labelCanvas,
      currentCanvas,
      playing: animationStore.playing,
      actions: animationStore.actions,
      selectedTargetIdList,
      selectedTargetSummaryList,
      propsStateMap: animationStore.visibledTargetPropsStateMap,
      lastSelectedKeyframe: animationStore.lastSelectedKeyframe,
      keyframeMapByFrame,
      selectedKeyframeMap: animationStore.selectedKeyframeMap,
      draftName,
      changeActionName() {
        const allNames = animationStore.actions.value.map((a) => a.name)
        if (allNames.includes(draftName.value)) {
          draftName.value = selectedAction.value?.name ?? ''
        } else {
          animationStore.updateAction({ name: draftName.value })
        }
      },
      currentFrame: animationStore.currentFrame,
      setPlaying: animationStore.setPlaying,
      jumpStartFrame: animationStore.jumpStartFrame,
      jumpEndFrame: animationStore.jumpEndFrame,
      jumpNextKey: animationStore.jumpNextKey,
      jumpPrevKey: animationStore.jumpPrevKey,
      endFrame: computed(() => {
        return animationStore.endFrame.value
      }),
      updateEndFrame(val: number, seriesKey?: string) {
        animationStore.setEndFrame(val, seriesKey)
      },
      addAction: animationStore.addAction,
      deleteAction: animationStore.deleteAction,
      actionOptions,
      selectedActionId: computed({
        get: () => selectedAction.value?.id ?? '',
        set: (id: string) => animationStore.selectAction(id),
      }),
      expandedMap: keyframeExpandedMap.booleanMap,
      toggleTargetExpanded: keyframeExpandedMap.toggle,
      targetTopMap,
      labelHeight,
      updateKeyframe(keyframe: KeyframeBase, seriesKey?: string) {
        animationStore.execUpdateKeyframes(
          { [keyframe.id]: keyframe },
          seriesKey
        )
      },
      selectTargetProp: animationStore.selectTargetProp,

      canvasType: canvasList.canvasType,
      setCurrentCanvas: canvasList.setCanvas,
      canvasOptions: canvasList.canvasOptions,
      keyframePointColorMap,

      availableCommandList: computed(
        () => canvasMode.mode.value.availableCommandList.value
      ),
      mode: canvasMode.mode,
      ...canvasMode.handlers,
    }
  },
})
</script>

<style lang="scss" scoped>
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
  > * {
    margin-right: 8px;
  }
  .select-canvas {
    width: 80px;
  }
  .select-action {
    width: 160px;
  }
  .end-frame-field {
    margin: 0 0 0 auto;
    .slider {
      width: 80px;
    }
  }
  .action-buttons {
    display: flex;
    align-items: center;
    button {
      width: 20px;
      height: 20px;
      & + button {
        margin-left: 4px;
      }
    }
  }
}
.middle {
  flex: 1;
  min-height: 0; // for flex grow
}
.label-canvas {
  overflow: hidden;
}
.timeline-canvas-space {
  height: 100%;
  .timeline-canvas-inner {
    height: 100%;
    position: relative;
    .command-exam-panel {
      position: absolute;
      bottom: 4px;
      right: 8px;
    }
  }
}
.graph-panel-space {
  height: 100%;
  border: solid 1px #000;
  overflow: auto;
}
</style>
