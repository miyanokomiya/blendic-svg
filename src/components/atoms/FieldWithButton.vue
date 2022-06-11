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
  <div class="field-with-button">
    <div class="field">
      <slot />
    </div>
    <div class="button">
      <slot name="button" />
    </div>
  </div>
</template>

<style scoped>
.field-with-button {
  width: 100%;
  display: flex;
  align-items: center;
}
.field {
  flex: 1;
}
.button {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}
.button > ::v-deep(button) {
  width: 100%;
  height: 100%;
}
</style>
