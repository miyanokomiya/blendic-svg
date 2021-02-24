<template>
  <div class="animation-panel-root">
    <div class="top">
      <div class="select-action">
        <SelectField v-model="selectedActionId" :options="actionOptions" />
      </div>
      <input v-model="draftName" type="text" @change="changeActionName" />
      <button class="add-action" @click="addAction">+</button>
      <button class="delete-action" @click="deleteAction">x</button>
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
      <label class="end-frame-field"
        >End:
        <input v-model="draftEndFrame" type="number" @change="changeEndFrame" />
      </label>
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
import CommandExamPanel from '/@/components/molecules/CommandExamPanel.vue'
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
    CommandExamPanel,
  },
  setup() {
    const labelWidth = 140
    const axisPadding = 20

    const store = useStore()
    const animationStore = useAnimationStore()

    const keyframeEditMode = useKeyframeEditMode()

    const editMode = ref<'' | 'move-current-frame'>('')
    const draftName = ref('')
    const draftEndFrame = ref('')

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

    function downCurrentFrame() {
      editMode.value = 'move-current-frame'
    }
    function downLeft(current: IVec2) {
      drag(current)
    }
    function drag(current: IVec2) {
      if (editMode.value === 'move-current-frame') {
        animationStore.setCurrentFrame(
          getNearestFrameAtPoint(current.x - labelWidth - axisPadding)
        )
      }
    }
    function upLeft() {
      editMode.value = ''
    }

    function animationCallback(tickFrame: number) {
      animationStore.stepFrame(
        tickFrame,
        animationStore.playing.value === 'reverse'
      )
    }

    watchEffect(() => {
      draftName.value = selectedAction.value?.name ?? ''
    })
    watchEffect(() => {
      draftEndFrame.value = animationStore.endFrame.value.toString()
    })

    let animationLoop: ReturnType<typeof useAnimationLoop>
    watchEffect(() => {
      animationLoop?.stop()
      if (animationStore.playing.value === 'pause') return

      animationLoop = useAnimationLoop(animationCallback, 60)
      animationLoop.begin()
    })

    return {
      playing: animationStore.playing,
      actions: animationStore.actions.value,
      selectedAllBoneList,
      selectedAllBoneIdList,
      keyframeMapByFrame,
      selectedKeyframeMap: animationStore.selectedKeyframeMap,
      draftName,
      draftEndFrame,
      labelWidth,
      axisPadding,
      currentFrame: animationStore.currentFrame,
      endFrame: animationStore.endFrame,
      setPlaying: animationStore.setPlaying,
      jumpStartFrame: animationStore.jumpStartFrame,
      jumpEndFrame: animationStore.jumpEndFrame,
      jumpNextKey: animationStore.jumpNextKey,
      jumpPrevKey: animationStore.jumpPrevKey,
      changeActionName: () => {
        if (!draftName.value) return
        animationStore.updateAction({ name: draftName.value })
      },
      changeEndFrame: () => {
        const val = parseInt(draftEndFrame.value, 10)
        if (!isNaN(val) && val >= 0) {
          animationStore.setEndFrame(val)
        } else {
          draftEndFrame.value = animationStore.endFrame.value.toString()
        }
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
    input {
      width: 4rem;
    }
  }
  button {
    width: 20px;
    height: 20px;
    border: solid 1px #000;
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
