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
  <div v-for="(c, i) in constraints" :key="i" class="constraints-item">
    <div class="constraint-header">
      <TextInput
        :model-value="c.name"
        @update:modelValue="(val) => updateName(i, val)"
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
    <template v-if="c.type === 'IK'">
      <IKOptionField
        :model-value="c.option"
        :bone-options="boneOptions"
        @update:modelValue="
          (option, seriesKey) => updateConstraint(i, option, seriesKey)
        "
      />
    </template>
    <template v-else-if="c.type === 'LIMIT_LOCATION'">
      <LimitLocationOptionField
        :model-value="c.option"
        @update:modelValue="
          (option, seriesKey) => updateConstraint(i, option, seriesKey)
        "
      />
    </template>
    <template v-else-if="c.type === 'LIMIT_ROTATION'">
      <LimitRotationOptionField
        :model-value="c.option"
        @update:modelValue="
          (option, seriesKey) => updateConstraint(i, option, seriesKey)
        "
      />
    </template>
    <template v-else-if="c.type === 'LIMIT_SCALE'">
      <LimitScaleOptionField
        :model-value="c.option"
        @update:modelValue="
          (option, seriesKey) => updateConstraint(i, option, seriesKey)
        "
      />
    </template>
    <template v-else-if="c.type === 'COPY_LOCATION'">
      <CopyLocationOptionField
        :model-value="c.option"
        :bone-options="boneOptions"
        @update:modelValue="
          (option, seriesKey) => updateConstraint(i, option, seriesKey)
        "
      />
    </template>
    <template v-else-if="c.type === 'COPY_ROTATION'">
      <CopyRotationOptionField
        :model-value="c.option"
        :bone-options="boneOptions"
        @update:modelValue="
          (option, seriesKey) => updateConstraint(i, option, seriesKey)
        "
      />
    </template>
    <template v-else-if="c.type === 'COPY_SCALE'">
      <CopyScaleOptionField
        :model-value="c.option"
        :bone-options="boneOptions"
        @update:modelValue="
          (option, seriesKey) => updateConstraint(i, option, seriesKey)
        "
      />
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import {
  BoneConstraint,
  BoneConstraintType,
  BoneConstraintOption,
  getConstraintByType,
} from '/@/utils/constraints'
import SelectButton from '/@/components/atoms/SelectButton.vue'
import TextInput from '/@/components/atoms/TextInput.vue'
import UpIcon from '/@/components/atoms/UpIcon.vue'
import DeleteIcon from '/@/components/atoms/DeleteIcon.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import IKOptionField from '/@/components/molecules/constraints/IKOptionField.vue'
import LimitLocationOptionField from '/@/components/molecules/constraints/LimitLocationOptionField.vue'
import LimitRotationOptionField from '/@/components/molecules/constraints/LimitRotationOptionField.vue'
import LimitScaleOptionField from '/@/components/molecules/constraints/LimitScaleOptionField.vue'
import CopyLocationOptionField from '/@/components/molecules/constraints/CopyLocationOptionField.vue'
import CopyRotationOptionField from '/@/components/molecules/constraints/CopyRotationOptionField.vue'
import CopyScaleOptionField from '/@/components/molecules/constraints/CopyScaleOptionField.vue'
import { getNotDuplicatedName, updateNameInList } from '/@/utils/relations'

const constraintNameMap: { [key in BoneConstraintType]: string } = {
  IK: 'IK',
  LIMIT_LOCATION: 'Limit Location',
  LIMIT_ROTATION: 'Limit Rotation',
  LIMIT_SCALE: 'Limit Scale',
  COPY_LOCATION: 'Copy Location',
  COPY_ROTATION: 'Copy Rotation',
  COPY_SCALE: 'Copy Scale',
} as const

export default defineComponent({
  components: {
    SelectButton,
    TextInput,
    UpIcon,
    DeleteIcon,
    InlineField,
    IKOptionField,
    LimitLocationOptionField,
    LimitRotationOptionField,
    LimitScaleOptionField,
    CopyLocationOptionField,
    CopyRotationOptionField,
    CopyScaleOptionField,
  },
  props: {
    constraints: {
      type: Array as PropType<BoneConstraint[]>,
      required: true,
    },
    boneOptions: {
      type: Array as PropType<{ value: string; label: string }[]>,
      required: true,
    },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const constraintOptions = computed<
      { value: BoneConstraintType; label: string }[]
    >(() => {
      return Object.keys(constraintNameMap).map((key) => ({
        value: key as BoneConstraintType,
        label: constraintNameMap[key as BoneConstraintType],
      }))
    })

    function setBoneConstraintType(val: BoneConstraintType) {
      if (!val) return
      addConstraint(val)
    }

    function update(constraints: BoneConstraint[], seriesKey?: string) {
      emit('update', constraints, seriesKey)
    }

    function addConstraint(type: BoneConstraintType) {
      const created = getConstraintByType(type)
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
      const constraints = props.constraints.concat()
      constraints.splice(index, 1, { ...constraints[index], option })
      update(constraints, seriesKey)
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
      if (index === 0) return

      const constraints = props.constraints.concat()
      const tmp = constraints[index - 1]
      constraints[index - 1] = constraints[index]
      constraints[index] = tmp
      update(constraints)
    }

    function downConstraint(index: number) {
      if (index === props.constraints.length - 1) return

      const constraints = props.constraints.concat()
      const tmp = constraints[index + 1]
      constraints[index + 1] = constraints[index]
      constraints[index] = tmp
      update(constraints)
    }

    return {
      constraintOptions,
      setBoneConstraintType,
      deleteConstraint,
      updateName,
      updateConstraint,
      upConstraint,
      downConstraint,
    }
  },
})
</script>

<style lang="scss" scoped>
.constraints-item {
  padding: 8px 0;
  width: 100%;
  margin-top: 10px;
  border-top: solid 1px #aaa;
  .constraint-header {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    > button {
      margin-left: 4px;
      border-radius: 8px;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      .icon {
        height: 100%;
      }
    }
    .name {
      margin-right: auto;
      font-size: 14px;
      font-weight: 600;
      text-align: left;
    }
  }
}
</style>
