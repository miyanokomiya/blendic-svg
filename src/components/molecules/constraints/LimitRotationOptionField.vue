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
  <div class="limit-rotation-option-field">
    <div class="field">
      <label>Space Type</label>
      <SelectField v-model="spaceType" :options="spaceTypeOptions" />
    </div>
    <div class="field">
      <label>Min</label>
      <NumberInput v-model="min" />
    </div>
    <div class="field">
      <label>Max</label>
      <NumberInput v-model="max" />
    </div>
    <div class="field">
      <label>Influence</label>
      <NumberInput v-model="influence" :min="0" :max="1" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { BoneConstraintOptions } from '/@/utils/constraints'
import NumberInput from '/@/components/atoms/NumberInput.vue'
import SelectField from '/@/components/atoms/SelectField.vue'
import { SpaceType } from '/@/models'

export default defineComponent({
  components: { NumberInput, SelectField },
  props: {
    modelValue: {
      type: Object as PropType<BoneConstraintOptions['LIMIT_ROTATION']>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function emitUpdated(
      val: Partial<BoneConstraintOptions['LIMIT_ROTATION']>
    ) {
      emit('update:modelValue', { ...props.modelValue, ...val })
    }

    const spaceTypeOptions = computed<{ value: SpaceType; label: string }[]>(
      () => {
        return [
          { value: 'world', label: 'World' },
          // { value: 'local', label: 'Local' },
        ]
      }
    )

    return {
      spaceTypeOptions,
      spaceType: computed({
        get(): SpaceType {
          return props.modelValue.spaceType
        },
        set(val: SpaceType) {
          emitUpdated({ spaceType: val })
        },
      }),
      min: computed({
        get(): number {
          return props.modelValue.min
        },
        set(val: number) {
          emitUpdated({ min: val })
        },
      }),
      max: computed({
        get(): number {
          return props.modelValue.max
        },
        set(val: number) {
          emitUpdated({ max: val })
        },
      }),
      influence: computed({
        get(): number {
          return props.modelValue.influence
        },
        set(val: number) {
          emitUpdated({ influence: val })
        },
      }),
    }
  },
})
</script>

<style lang="scss" scoped>
.limit-rotation-option-field {
  text-align: left;
  padding: 8px 0;
  box-sizing: border-box;
  .field {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    &:last-child {
      margin-bottom: 0;
    }
    > label {
      display: block;
      width: 100px;
      flex-shrink: 0;
      & + * {
        flex: 1;
        min-width: 0;
      }
    }
  }
}
</style>
