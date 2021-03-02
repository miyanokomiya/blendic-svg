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
  <div class="ik-option-field">
    <div class="field">
      <label>Target</label>
      <SelectField v-model="targetId" :options="boneOptions" />
    </div>
    <div class="field">
      <label>Pole Target</label>
      <SelectField v-model="poleTargetId" :options="boneOptions" />
    </div>
    <div class="field">
      <label>Chain Length</label>
      <NumberInput v-model="chainLength" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { BoneConstraintOption } from '/@/utils/constraints'
import NumberInput from '/@/components/atoms/NumberInput.vue'
import SelectField from '/@/components/atoms/SelectField.vue'

export default defineComponent({
  components: { NumberInput, SelectField },
  props: {
    modelValue: {
      type: Object as PropType<BoneConstraintOption['IK']>,
      required: true,
    },
    boneOptions: {
      type: Array as PropType<{ value: string; label: string }[]>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function emitUpdated(val: Partial<BoneConstraintOption['IK']>) {
      emit('update:modelValue', { ...props.modelValue, ...val })
    }

    return {
      targetId: computed({
        get(): string {
          return props.modelValue.targetId
        },
        set(val: string) {
          emitUpdated({ targetId: val })
        },
      }),
      poleTargetId: computed({
        get(): string {
          return props.modelValue.poleTargetId
        },
        set(val: string) {
          emitUpdated({ poleTargetId: val })
        },
      }),
      chainLength: computed({
        get(): number {
          return props.modelValue.chainLength
        },
        set(val: number) {
          emitUpdated({ chainLength: val })
        },
      }),
    }
  },
})
</script>

<style lang="scss" scoped>
.ik-option-field {
  text-align: left;
  border-top: solid 1px #aaa;
  padding: 8px 0;
  box-sizing: border-box;
  .field {
    margin-bottom: 10px;
    &:last-child {
      margin-bottom: 0;
    }
    > label {
      display: block;
      margin-bottom: 8px;
    }
  }
}
</style>
