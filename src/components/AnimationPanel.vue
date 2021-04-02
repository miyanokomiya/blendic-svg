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
          :model-value="currentCanvas"
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
    <ResizableH class="middle" :initial-rate="0.15" dense>
      <template #left="{ size }">
        <TimelineCanvas class="label-canvas" :canvas="labelCanvas">
          <template #default="{ scale, viewOrigin }">
            <g
              :transform="`translate(${viewOrigin.x}, ${viewOrigin.y}) scale(${scale})`"
            >
              <TimelineBones
                :selected-all-bone-list="selectedAllBoneList"
                :label-width="size + 1"
                :scroll-y="viewOrigin.y"
                :bone-expanded-map="boneExpandedMap"
                :bone-top-map="boneTopMap"
                :height="labelHeight"
                @toggle-bone-expanded="toggleBoneExpanded"
              />
            </g>
          </template>
        </TimelineCanvas>
      </template>
      <template #right>
        <ResizableH class="timeline-canvas-space" :initial-rate="0.8" dense>
          <template #left>
            <div class="timeline-canvas-inner">
              <TimelineCanvas
                v-if="currentCanvas === 'action'"
                :canvas="keyframeCanvas"
                :popup-menu-list="popupMenuList"
                @up-left="upLeft"
                @drag="drag"
                @down-left="downLeft"
                @mousemove="mousemove"
                @click-empty="clickEmpty"
                @escape="escape"
                @a="selectAll"
                @x="deleteKeyframes"
                @g="grab"
                @t="interpolation"
                @ctrl-c="clipKeyframes"
                @ctrl-v="pasteKeyframes"
                @shift-d="duplicateKeyframes"
              >
                <template #default="{ scale, viewOrigin, viewSize }">
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
                        :scale="scale"
                        :keyframe-map-by-frame="keyframeMapByFrame"
                        :bone-ids="selectedAllBoneIdList"
                        :selected-keyframe-map="selectedKeyframeMap"
                        :scroll-y="viewOrigin.y"
                        :bone-expanded-map="boneExpandedMap"
                        :bone-top-map="boneTopMap"
                        :height="labelHeight"
                        @select="selectKeyframe"
                        @shift-select="shiftSelectKeyframe"
                        @select-frame="selectKeyframeByFrame"
                        @shift-select-frame="shiftSelectKeyframeByFrame"
                      />
                    </TimelineAxis>
                  </g>
                </template>
              </TimelineCanvas>
              <TimelineCanvas
                v-if="currentCanvas === 'graph'"
                :canvas="graphCanvas"
                :popup-menu-list="popupMenuList"
                @up-left="upLeft"
                @drag="drag"
                @down-left="downLeft"
                @mousemove="mousemove"
                @click-empty="clickEmpty"
                @escape="escape"
                @a="selectAll"
                @x="deleteKeyframes"
                @g="grab"
                @t="interpolation"
                @ctrl-c="clipKeyframes"
                @ctrl-v="pasteKeyframes"
                @shift-d="duplicateKeyframes"
              >
                <template #default="{ scale, viewOrigin, viewSize }">
                  <g :transform="`translate(${viewOrigin.x}, 0)`">
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
                      <g :transform="`translate(0, ${-viewOrigin.y})`">
                        <GraphKeyframes
                          :scale="scale"
                          :keyframe-map-by-frame="keyframeMapByFrame"
                          :selected-keyframe-map="selectedKeyframeMap"
                          :color-map="keyframePointColorMap"
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
import { computed, defineComponent, ref, watchEffect } from 'vue'
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
import { mapReduce, toList } from '/@/utils/commons'
import { useAnimationLoop } from '../composables/animationLoop'
import { useKeyframeEditMode } from '../composables/modes/keyframeEditMode'
import { IdMap } from '/@/models'
import ResizableH from '/@/components/atoms/ResizableH.vue'
import { useCanvas } from '/@/composables/canvas'
import { EditMovement, KeyframeModeName } from '/@/composables/modes/types'
import { KeyframeBase } from '/@/models/keyframe'

const labelHeight = 24

function useMode() {
  const name = ref<KeyframeModeName>('action')
  const mode = computed(() => {
    switch (name.value) {
      case 'action':
        return useKeyframeEditMode()
      default:
        return useKeyframeEditMode()
    }
  })
  function setMode(val: KeyframeModeName) {
    name.value = val
  }

  return { name, mode, setMode }
}

type CanvasType = 'action' | 'graph'
const canvasOptions: { label: string; value: CanvasType }[] = [
  { label: 'Action', value: 'action' },
  { label: 'Graph', value: 'graph' },
]

function useCanvasList() {
  const current = ref<CanvasType>('graph')
  function setCanvas(val: CanvasType) {
    current.value = val
  }
  return {
    current,
    setCanvas,
    canvasOptions: computed(() => canvasOptions),
  }
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

    const canvasOptions = {
      scaleMin: 1,
      ignoreNegativeY: true,
      scaleAtFixY: true,
      scale: ref(1),
      viewOrigin: ref<IVec2>({ x: -20, y: 0 }),
    }
    const labelCanvas = useCanvas(canvasOptions)
    const keyframeCanvas = useCanvas(canvasOptions)
    const graphCanvas = useCanvas({
      scaleMin: 1,
      viewOrigin: ref<IVec2>({ x: -20, y: 0 }),
    })

    const keyframeEditMode = useMode()

    const selectedAction = computed(() => animationStore.selectedAction.value)
    const selectedAllBoneIdList = computed(() =>
      Object.keys(animationStore.selectedBoneIdMap.value)
    )
    const selectedAllBoneList = computed(() =>
      toList(animationStore.selectedBoneMap.value)
    )
    const keyframeMapByFrame = computed(() => {
      return getKeyframeMapByFrame(
        mergeKeyframesWithDropped(
          // fixed keyframes
          toList({
            ...animationStore.visibledKeyframeMap.value,
            ...(keyframeEditMode.mode.value.editedKeyframeMap.value
              ?.notSelected ?? {}),
          }) as any,
          // moved keyframes
          toList({
            ...(keyframeEditMode.mode.value.tmpKeyframes.value ?? {}),
            ...(keyframeEditMode.mode.value.editedKeyframeMap.value?.selected ??
              {}),
          }) as any,
          true
        ).merged
      )
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

    function downCurrentFrame() {
      keyframeEditMode.mode.value.grabCurrentFrame()
    }
    function downLeft(arg: EditMovement) {
      keyframeEditMode.mode.value.drag(arg)
    }
    function drag(arg: EditMovement) {
      keyframeEditMode.mode.value.drag(arg)
    }
    function upLeft() {
      keyframeEditMode.mode.value.upLeft()
    }

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

    const boneExpandedMap = ref<IdMap<boolean>>({})
    watchEffect(() => {
      boneExpandedMap.value = mapReduce(store.boneMap.value, () => false)
    })
    function toggleBoneExpanded(boneId: string) {
      boneExpandedMap.value[boneId] = !boneExpandedMap.value[boneId]
    }

    const boneTopMap = computed(() => {
      let current = 2 * labelHeight
      return selectedAllBoneIdList.value.reduce<IdMap<number>>((p, id) => {
        const top = current
        current = current + labelHeight * (boneExpandedMap.value[id] ? 6 : 1)
        p[id] = top
        return p
      }, {})
    })

    const keyframePointColorMap = computed(() => {
      return {
        translateX: 'red',
        translateY: 'green',
        rotate: 'blue',
        scaleX: 'red',
        scaleY: 'green',
      }
    })

    const canvasList = useCanvasList()

    return {
      labelCanvas,
      keyframeCanvas,
      graphCanvas,
      playing: animationStore.playing,
      actions: animationStore.actions.value,
      selectedAllBoneIdList,
      selectedAllBoneList,
      lastSelectedKeyframe: animationStore.lastSelectedKeyframe,
      keyframeMapByFrame,
      selectedKeyframeMap: animationStore.selectedKeyframeMap,
      draftName,
      popupMenuList: keyframeEditMode.mode.value.popupMenuList,
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
      downCurrentFrame,
      downLeft,
      drag,
      upLeft,
      escape: keyframeEditMode.mode.value.cancel,
      selectKeyframe: keyframeEditMode.mode.value.select,
      shiftSelectKeyframe: keyframeEditMode.mode.value.shiftSelect,
      selectKeyframeByFrame: keyframeEditMode.mode.value.selectFrame,
      shiftSelectKeyframeByFrame: keyframeEditMode.mode.value.shiftSelectFrame,
      selectAll: keyframeEditMode.mode.value.selectAll,
      grab: () => keyframeEditMode.mode.value.setEditMode('grab'),
      interpolation: () =>
        keyframeEditMode.mode.value.setEditMode('interpolation'),
      deleteKeyframes: keyframeEditMode.mode.value.execDelete,
      clipKeyframes: keyframeEditMode.mode.value.clip,
      pasteKeyframes: keyframeEditMode.mode.value.paste,
      duplicateKeyframes: keyframeEditMode.mode.value.duplicate,
      clickEmpty: keyframeEditMode.mode.value.clickEmpty,
      mousemove: keyframeEditMode.mode.value.mousemove,
      availableCommandList: keyframeEditMode.mode.value.availableCommandList,
      boneExpandedMap,
      toggleBoneExpanded,
      boneTopMap,
      labelHeight,
      updateKeyframe(keyframe: KeyframeBase) {
        animationStore.execUpdateKeyframes({ [keyframe.id]: keyframe })
      },
      currentCanvas: canvasList.current,
      setCurrentCanvas: canvasList.setCanvas,
      canvasOptions: canvasList.canvasOptions,
      keyframePointColorMap,
      grabControl: keyframeEditMode.mode.value.grabControl,
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
  .select-canvas,
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
