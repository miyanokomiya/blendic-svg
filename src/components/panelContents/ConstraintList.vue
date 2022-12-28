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
  <InlineField label="Constraints">
    <SelectButton
      :options="constraintOptions"
      @select="setBoneConstraintType"
    />
  </InlineField>
  <div v-for="(c, i) in constraints" :key="c.id" class="constraints-item">
    <div class="constraint-header">
      <TextInput
        :model-value="c.name"
        @update:model-value="(val) => updateName(i, val)"
      />
      <button :disabled="i === 0" type="button" @click="upConstraint(i)">
        <UpIcon class="icon" />
      </button>
      <button
        :disabled="i === constraints.length - 1"
        type="button"
        @click="downConstraint(i)"
      >
        <UpIcon class="icon" flipped />
      </button>
      <button type="button" @click="deleteConstraint(i)">
        <DeleteIcon class="icon" />
      </button>
    </div>
    <component
      :is="componentMap[c.type]"
      :model-value="c.option"
      :props-updated-status="getKeyframeUpdatedStatus(c.id)"
      :keyframe-status-map="getKeyframeStatus(c.id)"
      :bone-options="boneOptions"
      :pick-bone="pickBone"
      :create-keyframe="createKeyframe(i)"
      :delete-keyframe="deleteKeyframe(i)"
      @update:model-value="
        (option, seriesKey) => updateConstraint(i, option, seriesKey)
      "
      @add-keyframe="(key) => addKeyframe(i, key)"
      @remove-keyframe="(key) => removeKeyframe(i, key)"
      @start-pick-bone="($event) => $emit('start-pick-bone', $event)"
    />
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'
import {
  BoneConstraint,
  BoneConstraintType,
  BoneConstraintOption,
  getConstraint,
} from '/@/utils/constraints'
import IKOptionField from '/@/components/molecules/constraints/IKOptionField.vue'
import LimitLocationOptionField from '/@/components/molecules/constraints/LimitLocationOptionField.vue'
import LimitRotationOptionField from '/@/components/molecules/constraints/LimitRotationOptionField.vue'
import LimitScaleOptionField from '/@/components/molecules/constraints/LimitScaleOptionField.vue'
import CopyLocationOptionField from '/@/components/molecules/constraints/CopyLocationOptionField.vue'
import CopyRotationOptionField from '/@/components/molecules/constraints/CopyRotationOptionField.vue'
import CopyScaleOptionField from '/@/components/molecules/constraints/CopyScaleOptionField.vue'
import {
  getNotDuplicatedName,
  shiftInList,
  unshiftInList,
  updateNameInList,
} from '/@/utils/relations'
import {
  KeyframeConstraint,
  KeyframeConstraintPropKey,
} from '/@/models/keyframe'
import { IdMap, toMap } from '/@/models'
import { getKeyframeExistedPropsMap } from '/@/utils/keyframes'
import { mapReduce } from '/@/utils/commons'

const constraintNameMap: { [key in BoneConstraintType]: string } = {
  IK: 'IK',
  LIMIT_LOCATION: 'Limit Location',
  LIMIT_ROTATION: 'Limit Rotation',
  LIMIT_SCALE: 'Limit Scale',
  COPY_LOCATION: 'Copy Location',
  COPY_ROTATION: 'Copy Rotation',
  COPY_SCALE: 'Copy Scale',
} as const

const componentMap = {
  IK: IKOptionField,
  LIMIT_LOCATION: LimitLocationOptionField,
  LIMIT_ROTATION: LimitRotationOptionField,
  LIMIT_SCALE: LimitScaleOptionField,
  COPY_LOCATION: CopyLocationOptionField,
  COPY_ROTATION: CopyRotationOptionField,
  COPY_SCALE: CopyScaleOptionField,
}
</script>

<script lang="ts" setup>
import SelectButton from '/@/components/atoms/SelectButton.vue'
import TextInput from '/@/components/atoms/TextInput.vue'
import UpIcon from '/@/components/atoms/UpIcon.vue'
import DeleteIcon from '/@/components/atoms/DeleteIcon.vue'
import InlineField from '/@/components/atoms/InlineField.vue'

const props = withDefaults(
  defineProps<{
    constraints: BoneConstraint[]
    originalConstraints?: IdMap<BoneConstraint>
    boneOptions: { value: string; label: string }[]
    pickBone?: (key: string, callback: (id: string) => void) => void
    constraintKeyframeMap?: IdMap<KeyframeConstraint[]>
    currentFrame?: number
  }>(),
  {
    originalConstraints: () => ({}),
    pickBone: undefined,
    constraintKeyframeMap: () => ({}),
    currentFrame: 0,
  }
)

const emit = defineEmits<{
  (e: 'update', ...values: any): void
  (e: 'update-item', ...values: any): void
  (e: 'add-keyframe', ...values: any): void
  (e: 'remove-keyframe', ...values: any): void
  (e: 'start-pick-bone', ...values: any): void
}>()

const constraintMap = computed(() => toMap(props.constraints))

const constraintOptions = computed<
  { value: BoneConstraintType; label: string }[]
>(() => {
  return Object.keys(constraintNameMap).map((key) => ({
    value: key as BoneConstraintType,
    label: constraintNameMap[key as BoneConstraintType],
  }))
})

function getKeyframeStatus(id: string) {
  const keyframes = props.constraintKeyframeMap[id]
  if (!keyframes) return

  return mapReduce(getKeyframeExistedPropsMap(keyframes).props, (list) => {
    return list.some((k) => k.frame === props.currentFrame) ? 'self' : 'others'
  })
}

function getKeyframeUpdatedStatus(
  id: string
): Partial<{ [key in KeyframeConstraintPropKey]: boolean }> {
  const origin = props.originalConstraints[id]
  const current = constraintMap.value[id]
  if (!origin || !current) return {}

  return {
    influence: origin.option.influence !== current.option.influence,
  }
}

function setBoneConstraintType(val: BoneConstraintType) {
  if (!val) return
  addConstraint(val)
}

function update(constraints: BoneConstraint[], seriesKey?: string) {
  emit('update', constraints, seriesKey)
}

function addConstraint(type: BoneConstraintType) {
  const created = getConstraint({ type }, true)
  created.name = getNotDuplicatedName(
    constraintNameMap[created.type],
    props.constraints.map((c) => c.name)
  )
  update([...props.constraints, created])
}

function updateConstraint(
  index: number,
  option: BoneConstraintOption,
  seriesKey?: string
) {
  const target = props.constraints[index]
  emit('update-item', { ...target, option }, seriesKey)
}

function deleteConstraint(index: number) {
  const constraints = props.constraints.concat()
  constraints.splice(index, 1)
  update(constraints)
}

function updateName(index: number, name: string) {
  update(updateNameInList(props.constraints, index, name))
}

function upConstraint(index: number) {
  update(unshiftInList(props.constraints, index))
}

function downConstraint(index: number) {
  update(shiftInList(props.constraints, index))
}

function addKeyframe(index: number, key: KeyframeConstraintPropKey) {
  const target = props.constraints[index]
  if (!target) return
  emit('add-keyframe', target.id, key)
}

function removeKeyframe(index: number, key: KeyframeConstraintPropKey) {
  const target = props.constraints[index]
  if (!target) return
  emit('remove-keyframe', target.id, key)
}

function createKeyframe(index: number) {
  return (key: KeyframeConstraintPropKey) => {
    addKeyframe(index, key)
  }
}
function deleteKeyframe(index: number) {
  return (key: KeyframeConstraintPropKey) => {
    removeKeyframe(index, key)
  }
}
</script>

<style scoped>
.constraints-item {
  padding: 8px 0;
  width: 100%;
  margin-top: 10px;
  border-top: solid 1px var(--weak-border);
}
.constraints-item .constraint-header {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.constraints-item .constraint-header > button {
  margin-left: 4px;
  border-radius: 8px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.constraints-item .constraint-header > button .icon {
  height: 100%;
}
.constraints-item .constraint-header .name {
  margin-right: auto;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
}
</style>
