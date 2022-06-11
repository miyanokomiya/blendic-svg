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
  <div>
    <form
      v-if="selectedObjectType === 'armature' && lastSelectedArmature"
      @submit.prevent
    >
      <h3>Armature</h3>
      <InlineField label="Name" label-width="50px">
        <TextInput
          :model-value="lastSelectedArmature.name"
          @update:model-value="changeArmatureName"
        />
      </InlineField>
    </form>
    <form
      v-if="selectedObjectType === 'bone' && lastSelectedBone"
      @submit.prevent
    >
      <h3>Bone</h3>
      <InlineField label="Name" label-width="50px">
        <TextInput
          :model-value="lastSelectedBone.name"
          @update:model-value="changeBoneName"
        />
      </InlineField>
      <InlineField label="Parent" label-width="50px">
        <SelectField v-model="parentId" :options="otherBoneOptions" />
      </InlineField>
      <InlineField>
        <CheckboxInput
          v-model="connected"
          :disabled="!parentId"
          label="Connect"
        />
      </InlineField>
      <InlineField>
        <CheckboxInput v-model="inheritRotation" label="Inherit Rotation" />
      </InlineField>
      <InlineField>
        <CheckboxInput v-model="inheritScale" label="Inherit Scale" />
      </InlineField>
      <ConstraintList
        :constraints="constraintList"
        :original-constraints="originalInterpolatedConstraintMap"
        :bone-options="otherBoneOptions"
        :constraint-keyframe-map="constraintKeyframeMapByTargetId"
        :current-frame="currentFrame"
        @update="updateConstraints"
        @update-item="updateConstraint"
        @add-keyframe="addKeyframeConstraint"
        @remove-keyframe="removeKeyframeConstraint"
        @start-pick-bone="startPickBone"
      />
    </form>
  </div>
</template>

<script lang="ts">
import { ComputedRef, defineComponent, computed } from 'vue'
import { useStore } from '/@/store/index'
import SelectField from '/@/components/atoms/SelectField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import { BoneConstraint } from '/@/utils/constraints'
import ConstraintList from '/@/components/panelContents/ConstraintList.vue'
import { getBoneIdsWithoutDescendants } from '/@/utils/armatures'
import InlineField from '/@/components/atoms/InlineField.vue'
import TextInput from '/@/components/atoms/TextInput.vue'
import {
  KeyframeConstraint,
  KeyframeConstraintPropKey,
} from '/@/models/keyframe'
import { useAnimationStore } from '/@/store/animation'
import { getKeyframeExistedPropsMap } from '/@/utils/keyframes'
import { IdMap } from '/@/models'
import { PickerOptions } from '/@/composables/modes/types'
import { useCanvasStore } from '/@/store/canvas'

export default defineComponent({
  components: {
    SelectField,
    CheckboxInput,
    ConstraintList,
    InlineField,
    TextInput,
  },
  setup() {
    const store = useStore()
    const animationStore = useAnimationStore()
    const canvasStore = useCanvasStore()

    const lastSelectedBone = computed(() => {
      return store.lastSelectedBone.value
    })

    const constraintKeyframeMapByTargetId =
      animationStore.keyframeMapByTargetId as ComputedRef<
        IdMap<KeyframeConstraint[]>
      >
    const currentFrame = animationStore.currentFrame

    const otherBoneOptions = computed(() => {
      if (!lastSelectedBone.value) return []

      const boneMap = store.boneMap.value
      return getBoneIdsWithoutDescendants(
        boneMap,
        lastSelectedBone.value.id
      ).map((id) => ({ value: id, label: boneMap[id].name }))
    })

    const constraintList = computed(() => {
      if (!lastSelectedBone.value) return []

      return lastSelectedBone.value.constraints.map(
        (cid) => animationStore.currentInterpolatedConstraintMap.value[cid]
      )
    })

    const selectedObjectType = computed((): 'bone' | 'armature' | '' => {
      if (lastSelectedBone.value) return 'bone'
      if (store.lastSelectedArmature.value) return 'armature'
      return ''
    })

    function getKeyframeConstraint(
      constraintId: string
    ): KeyframeConstraint | undefined {
      return constraintKeyframeMapByTargetId.value[constraintId].find(
        (k) => k.frame === currentFrame.value
      ) as KeyframeConstraint | undefined
    }

    function updateConstraints(
      constraints: BoneConstraint[],
      seriesKey?: string
    ) {
      if (!lastSelectedBone.value) return

      store.updateBoneConstraints(constraints, seriesKey)
    }

    function updateConstraint(constraint: BoneConstraint, seriesKey?: string) {
      if (!lastSelectedBone.value) return

      const index = constraintList.value.findIndex(
        (c) => c.id === constraint.id
      )
      const current = constraintList.value[index]
      const existedProps =
        getKeyframeExistedPropsMap(
          constraintKeyframeMapByTargetId.value[constraint.id] ?? []
        ).props ?? {}

      // TODO only 'influence' supported now
      if (
        existedProps.influence &&
        current.option.influence !== constraint.option.influence
      ) {
        // update edited parameters
        animationStore.applyEditedConstraint(
          {
            [constraint.id]: { influence: constraint.option.influence },
          },
          seriesKey
        )
      } else {
        const next = constraintList.value.concat()
        next[index] = constraint
        store.updateBoneConstraints(next, seriesKey)
      }
    }

    function addKeyframeConstraint(
      constraintId: string,
      key: KeyframeConstraintPropKey
    ) {
      animationStore.execInsertKeyframeConstraint(constraintId, { [key]: true })
    }

    function removeKeyframeConstraint(
      constraintId: string,
      key: KeyframeConstraintPropKey
    ) {
      const target = getKeyframeConstraint(constraintId)
      if (!target) return
      animationStore.execDeleteKeyframeConstraint(target.id, { [key]: true })
    }

    function startPickBone(val?: PickerOptions) {
      canvasStore.dispatchCanvasEvent({
        type: 'state',
        data: { name: 'pick-bone', options: val },
      })
    }

    return {
      lastSelectedArmature: store.lastSelectedArmature,
      lastSelectedBone,
      constraintList,
      constraintKeyframeMapByTargetId,
      currentFrame,
      otherBoneOptions,
      selectedObjectType,
      connected: computed({
        get(): boolean {
          return lastSelectedBone.value?.connected ?? false
        },
        set(val: boolean) {
          store.updateBone({ connected: val })
        },
      }),
      inheritRotation: computed({
        get(): boolean {
          return lastSelectedBone.value?.inheritRotation ?? false
        },
        set(val: boolean) {
          store.updateBone({ inheritRotation: val })
        },
      }),
      inheritScale: computed({
        get(): boolean {
          return lastSelectedBone.value?.inheritScale ?? false
        },
        set(val: boolean) {
          store.updateBone({ inheritScale: val })
        },
      }),
      parentId: computed({
        get(): string {
          return lastSelectedBone.value?.parentId ?? ''
        },
        set(val: string) {
          store.updateBone({ parentId: val })
        },
      }),
      changeArmatureName(name: string) {
        store.updateArmatureName(name)
      },
      changeBoneName(name: string) {
        store.updateBoneName(name)
      },

      originalInterpolatedConstraintMap:
        animationStore.originalInterpolatedConstraintMap,
      updateConstraints,
      updateConstraint,
      addKeyframeConstraint,
      removeKeyframeConstraint,
      startPickBone,
    }
  },
})
</script>

<style lang="scss" scoped>
h3 {
  text-align: left;
  margin-bottom: 10px;
}
input[type='text'] {
  width: 100%;
}
</style>
