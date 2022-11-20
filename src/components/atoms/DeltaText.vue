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

Copyright (C) 2022, Tomoya Komiyama.
-->

<template>
  <p>
    <span v-for="(s, i) in deltaList" :key="i" :class="{ hit: s.hit }">{{
      s.text
    }}</span>
  </p>
</template>

<script lang="ts">
import { KeywordSplit } from '/@/utils/textSearch.js'
</script>

<script setup lang="ts">
defineProps<{
  deltaList: KeywordSplit[]
}>()
</script>

<style scoped>
.hit {
  font-weight: bold;
  color: var(--text-highlight-color);
  background-color: var(--text-highlight-background-color);
}
</style>
