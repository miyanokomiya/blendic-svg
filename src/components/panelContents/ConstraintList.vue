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
      @select="setBoneConstraintName"
    />
  </InlineField>
  <div v-for="(c, i) in constraints" :key="i" class="constraints-item">
    <template v-if="c.name === 'IK'">
      <IKOptionField
        :model-value="c.option"
        :bone-options="boneOptions"
        @update:modelValue="(option) => updateConstraint(i, option)"
      />
    </template>
    <template v-else-if="c.name === 'LIMIT_ROTATION'">
      <LimitRotationOptionField
        :model-value="c.option"
        @update:modelValue="(option) => updateConstraint(i, option)"
      />
    </template>
    <template v-else-if="c.name === 'COPY_LOCATION'">
      <CopyLocationOptionField
        :model-value="c.option"
        :bone-options="boneOptions"
        @update:modelValue="(option) => updateConstraint(i, option)"
      />
    </template>
    <template v-else-if="c.name === 'COPY_ROTATION'">
      <CopyRotationOptionField
        :model-value="c.option"
        :bone-options="boneOptions"
        @update:modelValue="(option) => updateConstraint(i, option)"
      />
    </template>
    <div class="constraint-buttons">
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
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import {
  BoneConstraint,
  BoneConstraintName,
  BoneConstraintOption,
  getConstraintByName,
} from '/@/utils/constraints'
import SelectButton from '/@/components/atoms/SelectButton.vue'
import UpIcon from '/@/components/atoms/UpIcon.vue'
import DeleteIcon from '/@/components/atoms/DeleteIcon.vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import IKOptionField from '/@/components/molecules/constraints/IKOptionField.vue'
import LimitRotationOptionField from '/@/components/molecules/constraints/LimitRotationOptionField.vue'
import CopyLocationOptionField from '/@/components/molecules/constraints/CopyLocationOptionField.vue'
import CopyRotationOptionField from '/@/components/molecules/constraints/CopyRotationOptionField.vue'

export default defineComponent({
  components: {
    SelectButton,
    UpIcon,
    DeleteIcon,
    InlineField,
    IKOptionField,
    LimitRotationOptionField,
    CopyLocationOptionField,
    CopyRotationOptionField,
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
      { value: BoneConstraintName; label: string }[]
    >(() => {
      return [
        { value: 'IK', label: 'IK' },
        { value: 'LIMIT_ROTATION', label: 'Limit Rotation' },
        { value: 'COPY_LOCATION', label: 'Copy Location' },
        { value: 'COPY_ROTATION', label: 'Copy Rotation' },
      ]
    })

    function setBoneConstraintName(val: BoneConstraintName) {
      if (!val) return
      addConstraint(val)
    }

    function update(constraints: BoneConstraint[]) {
      emit('update', constraints)
    }

    function addConstraint(name: BoneConstraintName) {
      update([...props.constraints, getConstraintByName(name)])
    }

    function updateConstraint(index: number, option: BoneConstraintOption) {
      const constraints = props.constraints.concat()
      constraints.splice(index, 1, { ...constraints[index], option })
      update(constraints)
    }

    function deleteConstraint(index: number) {
      const constraints = props.constraints.concat()
      constraints.splice(index, 1)
      update(constraints)
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
      setBoneConstraintName,
      deleteConstraint,
      updateConstraint,
      upConstraint,
      downConstraint,
    }
  },
})
</script>

<style lang="scss" scoped>
.constraints-item {
  width: 100%;
  margin-top: 10px;
  border-top: solid 1px #aaa;
  .constraint-buttons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    > button {
      margin-left: 8px;
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
  }
}
</style>
