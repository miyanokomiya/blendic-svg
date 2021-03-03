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
    <TabPanel
      :tabs="[
        { key: 'detail', label: 'Detail' },
        { key: 'history', label: 'History' },
        { key: 'tree', label: 'Tree' },
        { key: 'file', label: 'File' },
      ]"
      initial-tab="file"
    >
      <template #detail>
        <form v-if="selectedObjectType === 'armature'" @submit.prevent>
          <h3>Armature</h3>
          <div class="field inline">
            <label>Name</label>
            <input
              v-model="draftName"
              type="text"
              @change="changeArmatureName"
            />
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
          <div class="field inline">
            <label>Connect</label>
            <input v-model="connected" type="checkbox" :disabled="!parentId" />
          </div>
          <div class="field inline">
            <label>Constraints</label>
            <SelectField
              v-model="boneConstraintName"
              :options="[{ value: 'IK', label: 'IK' }]"
            />
          </div>
          <div
            v-for="(c, i) in lastSelectedBone.constraints"
            :key="c.name"
            class="constraints-item"
          >
            <template v-if="c.name === 'IK'">
              <IKOptionField
                :model-value="c.option"
                :bone-options="otherBoneOptions"
                @update:modelValue="(option) => updateConstraint(i, option)"
              />
              <div class="delete-constraint">
                <button type="button" @click="deleteConstraint(i)">x</button>
              </div>
            </template>
          </div>
        </form>
      </template>
      <template #history><HistoryStack /></template>
      <template #file>
        <FilePanel />
      </template>
      <template #tree>
        <TreePanel />
      </template>
    </TabPanel>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from 'vue'
import { useStore } from '/@/store/index'
import TabPanel from './TabPanel.vue'
import SelectField from './atoms/SelectField.vue'
import HistoryStack from '/@/components/panelContents/HistoryStack.vue'
import FilePanel from '/@/components/panelContents/FilePanel.vue'
import TreePanel from '/@/components/panelContents/TreePanel.vue'
import {
  BoneConstraintName,
  BoneConstraintOption,
  CreateConstraint,
} from '../utils/constraints'
import IKOptionField from '/@/components/molecules/constraints/IKOptionField.vue'

export default defineComponent({
  components: {
    TabPanel,
    HistoryStack,
    SelectField,
    FilePanel,
    TreePanel,
    IKOptionField,
  },
  setup() {
    const store = useStore()
    const draftName = ref('')

    const lastSelectedBone = computed(() => {
      return store.lastSelectedBone.value
    })

    const otherBoneOptions = computed(() => {
      if (!store.lastSelectedArmature.value || !lastSelectedBone.value)
        return []

      return store.lastSelectedArmature.value.bones
        .filter((b) => b.id !== lastSelectedBone.value?.id)
        .map((b) => ({ value: b.id, label: b.name }))
    })

    const selectedObjectType = computed((): 'bone' | 'armature' | '' => {
      if (lastSelectedBone.value) return 'bone'
      if (store.lastSelectedArmature.value) return 'armature'
      return ''
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
        CreateConstraint(name, {
          targetId: '',
          poleTargetId: '',
          iterations: 20,
          chainLength: 2,
        }),
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
      parentId: computed({
        get(): string {
          return lastSelectedBone.value?.parentId ?? ''
        },
        set(val: string) {
          store.updateBone({ parentId: val })
        },
      }),
      boneConstraintName: computed({
        get(): BoneConstraintName | '' {
          return ''
        },
        set(val: BoneConstraintName | '') {
          if (!val) return
          addConstraint(val)
        },
      }),
      changeArmatureName() {
        if (!draftName.value) return
        store.updateArmatureName(draftName.value)
      },
      changeBoneName() {
        if (!draftName.value) return
        store.updateBone({ name: draftName.value })
      },
      updateConstraint,
      deleteConstraint,
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
    .delete-constraint {
      text-align: right;
      > button {
        border: solid 1px #ccc;
        border-radius: 8px;
        width: 60px;
      }
    }
  }
}
</style>
