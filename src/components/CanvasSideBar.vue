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
  <SideBar :tabs="tabs" default-tab="item">
    <template #item>
      <ItemPanel />
    </template>
    <template #view>
      <ViewPanel />
    </template>
  </SideBar>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import SideBar from '/@/components/SideBar.vue'
import ItemPanel from '/@/components/panelContents/ItemPanel.vue'
import ViewPanel from '/@/components/panelContents/ViewPanel.vue'

type TabName = '' | 'item' | 'view'

export default defineComponent({
  components: { SideBar, ItemPanel, ViewPanel },
  setup() {
    const tabs = computed((): { key: TabName; label: string }[] => [
      { key: 'item', label: 'Item' },
      { key: 'view', label: 'View' },
    ])

    return { tabs }
  },
})
</script>
