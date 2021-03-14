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
    <div class="middle">
      <TimelineCanvas
        @up-left="upLeft"
        @drag="drag"
        @down-left="downLeft"
        @mousemove="mousemove"
        @click-empty="clickEmpty"
        @escape="escape"
        @a="selectAll"
        @x="deleteKeyframes"
        @g="grag"
        @ctrl-c="clipKeyframes"
        @ctrl-v="pasteKeyframes"
        @shift-d="duplicateKeyframes"
      >
        <template #default="{ scale, viewOrigin, viewSize }">
          <g
            :transform="`translate(${labelWidth + axisPadding}, ${
              viewOrigin.y
            })`"
          >
            <TimelineAxis
              :scale="scale"
              :origin-x="viewOrigin.x"
              :view-width="viewSize.width"
              :current-frame="currentFrame"
              :end-frame="endFrame"
              @down-current-frame="downCurrentFrame"
            />
            <Keyframes
              :scale="scale"
              :keyframe-map-by-frame="keyframeMapByFrame"
              :bone-ids="selectedAllBoneIdList"
              :selected-keyframe-map="selectedKeyframeMap"
              :scroll-y="viewOrigin.y"
              @select="selectKeyframe"
              @shift-select="shiftSelectKeyframe"
              @select-frame="selectKeyframeByFrame"
              @shift-select-frame="shiftSelectKeyframeByFrame"
            />
          </g>
          <g
            :transform="`translate(${viewOrigin.x}, ${viewOrigin.y}) scale(${scale})`"
          >
            <TimelineBones
              :selected-all-bone-list="selectedAllBoneList"
              :label-width="labelWidth"
              :scroll-y="viewOrigin.y"
            />
          </g>
        </template>
      </TimelineCanvas>
      <CommandExamPanel
        class="command-exam-panel"
        :available-command-list="availableCommandList"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watchEffect } from 'vue'
import { useStore } from '../store'
import { useAnimationStore } from '../store/animation'
import SelectField from './atoms/SelectField.vue'
import TimelineCanvas from './TimelineCanvas.vue'
import TimelineAxis from './elements/atoms/TimelineAxis.vue'
import TimelineBones from './elements/TimelineBones.vue'
import Keyframes from './elements/Keyframes.vue'
import AnimationController from './molecules/AnimationController.vue'
import AddIcon from '/@/components/atoms/AddIcon.vue'
import DeleteIcon from '/@/components/atoms/DeleteIcon.vue'
import SliderInput from '/@/components/atoms/SliderInput.vue'
import CommandExamPanel from '/@/components/molecules/CommandExamPanel.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import {
  getKeyframeMapByFrame,
  getNearestFrameAtPoint,
} from '../utils/animations'
import { IVec2 } from 'okageo'
import { mapReduce, toList } from '/@/utils/commons'
import { useAnimationLoop } from '../composables/animationLoop'
import { useKeyframeEditMode } from '../composables/keyframeEditMode'

export default defineComponent({
  components: {
    SelectField,
    TimelineCanvas,
    TimelineAxis,
    TimelineBones,
    Keyframes,
    AnimationController,
    SliderInput,
    CommandExamPanel,
    AddIcon,
    DeleteIcon,
    InlineField,
  },
  setup() {
    const labelWidth = 140
    const axisPadding = 20

    const store = useStore()
    const animationStore = useAnimationStore()

    const keyframeEditMode = useKeyframeEditMode()

    const editMode = ref<'' | 'move-current-frame'>('')
    const draftName = ref('')

    const selectedAction = computed(() => animationStore.selectedAction.value)
    const selectedAllBoneList = computed(() =>
      toList(animationStore.selectedAllBones.value)
    )
    const selectedAllBoneIdList = computed(() =>
      selectedAllBoneList.value.map((b) => b.id)
    )
    const keyframeMapByFrame = computed(() => {
      return getKeyframeMapByFrame(
        toList(
          mapReduce(
            {
              ...animationStore.visibledKeyframeMap.value,
              ...keyframeEditMode.tmpKeyframes.value,
            },
            (keyframe, id) => ({
              ...keyframe,
              frame: keyframeEditMode.getEditFrames(id),
            })
          )
        )
      )
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

    const moveCurrentFrameSeriesKey = ref<string>()
    function downCurrentFrame() {
      editMode.value = 'move-current-frame'
      moveCurrentFrameSeriesKey.value = `move-current-frame_${Date.now()}`
    }
    function downLeft(current: IVec2) {
      drag(current)
    }
    function drag(current: IVec2) {
      if (editMode.value === 'move-current-frame') {
        animationStore.setCurrentFrame(
          getNearestFrameAtPoint(current.x - labelWidth - axisPadding),
          moveCurrentFrameSeriesKey.value
        )
      }
    }
    function upLeft() {
      editMode.value = ''
      moveCurrentFrameSeriesKey.value = undefined
    }

    watchEffect(() => {
      draftName.value = selectedAction.value?.name ?? ''
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

    return {
      playing: animationStore.playing,
      actions: animationStore.actions.value,
      selectedAllBoneList,
      selectedAllBoneIdList,
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
      labelWidth,
      axisPadding,
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
      escape: keyframeEditMode.cancel,
      selectKeyframe: keyframeEditMode.select,
      shiftSelectKeyframe: keyframeEditMode.shiftSelect,
      selectKeyframeByFrame: keyframeEditMode.selectFrame,
      shiftSelectKeyframeByFrame: keyframeEditMode.shiftSelectFrame,
      selectAll: keyframeEditMode.selectAll,
      grag: () => keyframeEditMode.setEditMode('grab'),
      deleteKeyframes: keyframeEditMode.execDelete,
      clipKeyframes: keyframeEditMode.clip,
      pasteKeyframes: keyframeEditMode.paste,
      duplicateKeyframes: keyframeEditMode.duplicate,
      clickEmpty: keyframeEditMode.clickEmpty,
      downCurrentFrame,
      downLeft,
      drag,
      upLeft,
      mousemove: keyframeEditMode.mousemove,
      availableCommandList: keyframeEditMode.availableCommandList,
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
  position: relative;
  flex: 1;
  min-height: 0; // for flex grow
  .command-exam-panel {
    position: absolute;
    bottom: 4px;
    right: 8px;
  }
}
</style>
