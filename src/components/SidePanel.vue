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
        { key: 'file', label: 'File' },
        { key: 'detail', label: 'Detail' },
        { key: 'tree', label: 'Tree' },
        { key: 'history', label: 'History' },
      ]"
      initial-tab="file"
    >
      <template #detail><DetailPanel /></template>
      <template #history><HistoryStack /></template>
      <template #file><FilePanel /></template>
      <template #tree><TreePanel /></template>
    </TabPanel>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import TabPanel from './TabPanel.vue'
import HistoryStack from '/@/components/panelContents/HistoryStack.vue'
import FilePanel from '/@/components/panelContents/FilePanel.vue'
import TreePanel from '/@/components/panelContents/TreePanel.vue'
import DetailPanel from '/@/components/panelContents/DetailPanel.vue'

export default defineComponent({
  components: {
    TabPanel,
    DetailPanel,
    HistoryStack,
    FilePanel,
    TreePanel,
  },
})
</script>
