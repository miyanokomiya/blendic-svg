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
      <div class="field">
        <CheckboxInput v-model="inheritScale" label="Inherit Scale" />
      </div>
      <ConstraintList
        :constraints="lastSelectedBone.constraints"
        :bone-options="otherBoneOptions"
        @update="updateConstraints"
      />
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from 'vue'
import { useStore } from '/@/store/index'
import SelectField from '/@/components/atoms/SelectField.vue'
import CheckboxInput from '/@/components/atoms/CheckboxInput.vue'
import { BoneConstraint } from '/@/utils/constraints'
import ConstraintList from '/@/components/panelContents/ConstraintList.vue'
import { getBoneIdsWithoutDescendants } from '/@/utils/armatures'

export default defineComponent({
  components: {
    SelectField,
    CheckboxInput,
    ConstraintList,
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

    function updateConstraints(constraints: BoneConstraint[]) {
      if (!lastSelectedBone.value) return
      store.updateBone({ constraints })
    }

    watch(store.lastSelectedArmature, initDraftName)
    watch(lastSelectedBone, initDraftName)

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
      updateConstraints,
    }
  },
})
</script>

<style lang="scss" scoped>
h3 {
  margin-bottom: 10px;
}
form {
  padding-bottom: 10px;
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
}
</style>
