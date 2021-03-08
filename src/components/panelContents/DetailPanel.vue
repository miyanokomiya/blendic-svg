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
    <form v-if="selectedObjectType === 'armature'" @submit.prevent>
      <h3>Armature</h3>
      <div class="field inline">
        <label>Name</label>
        <input v-model="draftName" type="text" @change="changeArmatureName" />
      </div>
    </form>
    <form
      v-if="selectedObjectType === 'bone' && lastSelectedBone"
      @submit.prevent
    >
      <h3>Bone</h3>
      <div class="field inline">
        <label>Name</label>
        <input v-model="draftName" type="text" @change="changeBoneName" />
      </div>
      <div class="field inline">
        <label>Parent</label>
        <SelectField v-model="parentId" :options="otherBoneOptions" />
      </div>
      <div class="field">
        <CheckboxInput
          v-model="connected"
          :disabled="!parentId"
          label="Connect"
        />
      </div>
      <div class="field">
        <CheckboxInput v-model="inheritRotation" label="Inherit Rotation" />
      </div>
      <div class="field inline">
        <label>Constraints</label>
        <SelectButton
          :options="constraintOptions"
          @select="setBoneConstraintName"
        />
      </div>
      <div
        v-for="(c, i) in lastSelectedBone.constraints"
        :key="i"
        class="constraints-item"
      >
        <template v-if="c.name === 'IK'">
          <IKOptionField
            :model-value="c.option"
            :bone-options="otherBoneOptions"
            @update:modelValue="(option) => updateConstraint(i, option)"
          />
        </template>
        <template v-else-if="c.name === 'LIMIT_ROTATION'">
          <LimitRotationOptionField
            :model-value="c.option"
            @update:modelValue="(option) => updateConstraint(i, option)"
          />
        </template>
        <div class="constraint-buttons">
          <button :disabled="i === 0" type="button" @click="upConstraint(i)">
            <UpIcon class="icon" />
          </button>
          <button
            :disabled="
              !lastSelectedBone || i === lastSelectedBone.constraints.length - 1
            "
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
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from 'vue'
import { useStore } from '/@/store/index'
import SelectField from '/@/components/atoms/SelectField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import SelectButton from '/@/components/atoms/SelectButton.vue'
import {
  BoneConstraintName,
  BoneConstraintOption,
  getConstraintByName,
} from '/@/utils/constraints'
import IKOptionField from '/@/components/molecules/constraints/IKOptionField.vue'
import LimitRotationOptionField from '/@/components/molecules/constraints/LimitRotationOptionField.vue'
import UpIcon from '/@/components/atoms/UpIcon.vue'
import DeleteIcon from '/@/components/atoms/DeleteIcon.vue'
import { getBoneIdsWithoutDescendants } from '/@/utils/armatures'

export default defineComponent({
  components: {
    SelectField,
    SelectButton,
    CheckboxInput,
    IKOptionField,
    LimitRotationOptionField,
    UpIcon,
    DeleteIcon,
  },
  setup() {
    const store = useStore()
    const draftName = ref('')

    const lastSelectedBone = computed(() => {
      return store.lastSelectedBone.value
    })

    const otherBoneOptions = computed(() => {
      if (!lastSelectedBone.value) return []

      const boneMap = store.boneMap.value
      return getBoneIdsWithoutDescendants(
        boneMap,
        lastSelectedBone.value.id
      ).map((id) => ({ value: id, label: boneMap[id].name }))
    })

    const selectedObjectType = computed((): 'bone' | 'armature' | '' => {
      if (lastSelectedBone.value) return 'bone'
      if (store.lastSelectedArmature.value) return 'armature'
      return ''
    })

    const isArmatureNameDuplicated = computed(() => {
      if (draftName.value === store.lastSelectedArmature.value?.name)
        return false
      return store.state.armatures.map((a) => a.name).includes(draftName.value)
    })

    const isBoneNameDuplicated = computed(() => {
      return otherBoneOptions.value
        .map((o) => o.label)
        .includes(draftName.value)
    })

    function initDraftName() {
      if (lastSelectedBone.value) draftName.value = lastSelectedBone.value.name
      else if (store.lastSelectedArmature.value)
        draftName.value = store.lastSelectedArmature.value.name
      else draftName.value = ''
    }

    function addConstraint(name: BoneConstraintName) {
      if (!lastSelectedBone.value) return

      const constraints = [
        ...lastSelectedBone.value.constraints,
        getConstraintByName(name),
      ]
      store.updateBone({ constraints })
    }

    function updateConstraint(index: number, option: BoneConstraintOption) {
      if (!lastSelectedBone.value) return

      const constraints = lastSelectedBone.value.constraints.concat()
      constraints.splice(index, 1, { ...constraints[index], option })
      store.updateBone({ constraints })
    }

    function deleteConstraint(index: number) {
      if (!lastSelectedBone.value) return

      const constraints = lastSelectedBone.value.constraints.concat()
      constraints.splice(index, 1)
      store.updateBone({ constraints })
    }
    function upConstraint(index: number) {
      if (!lastSelectedBone.value) return
      if (index === 0) return

      const constraints = lastSelectedBone.value.constraints.concat()
      const tmp = constraints[index - 1]
      constraints[index - 1] = constraints[index]
      constraints[index] = tmp
      store.updateBone({ constraints })
    }
    function downConstraint(index: number) {
      if (!lastSelectedBone.value) return
      if (index === lastSelectedBone.value.constraints.length - 1) return

      const constraints = lastSelectedBone.value.constraints.concat()
      const tmp = constraints[index + 1]
      constraints[index + 1] = constraints[index]
      constraints[index] = tmp
      store.updateBone({ constraints })
    }

    watch(store.lastSelectedArmature, initDraftName)
    watch(lastSelectedBone, initDraftName)

    const constraintOptions = computed<
      { value: BoneConstraintName; label: string }[]
    >(() => {
      return [
        { value: 'IK', label: 'IK' },
        { value: 'LIMIT_ROTATION', label: 'Limit Rotation' },
      ]
    })

    return {
      draftName,
      lastSelectedArmature: store.lastSelectedArmature,
      lastSelectedBone,
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
      parentId: computed({
        get(): string {
          return lastSelectedBone.value?.parentId ?? ''
        },
        set(val: string) {
          store.updateBone({ parentId: val })
        },
      }),
      setBoneConstraintName(val: BoneConstraintName) {
        if (!val) return
        addConstraint(val)
      },
      changeArmatureName() {
        if (!draftName.value) return
        if (
          isArmatureNameDuplicated.value &&
          store.lastSelectedArmature.value
        ) {
          draftName.value = store.lastSelectedArmature.value.name
          return
        }
        store.updateArmatureName(draftName.value)
      },
      changeBoneName() {
        if (!draftName.value) return
        if (isBoneNameDuplicated.value && lastSelectedBone.value) {
          draftName.value = lastSelectedBone.value.name
        }
        store.updateBone({ name: draftName.value })
      },
      updateConstraint,
      deleteConstraint,
      upConstraint,
      downConstraint,
      constraintOptions,
    }
  },
})
</script>

<style lang="scss" scoped>
h3 {
  margin-bottom: 10px;
}
form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .field {
    margin-bottom: 10px;
    width: 100%;
    &:last-child {
      margin-bottom: 0;
    }
    &.inline {
      display: flex;
      align-items: center;
      > label {
        margin-right: 10px;
        min-width: 60px;
        text-align: left;
      }
      > label + * {
        flex: 1;
        min-width: 50px; // a magic to fix flex width
      }
    }
  }
  .constraints-item {
    width: 100%;
    margin-bottom: 10px;
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
}
</style>
