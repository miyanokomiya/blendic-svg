<template>
  <div class="view-panel">
    <h4>View</h4>
    <form>
      <div class="field inline">
        <label>Born Name</label>
        <input v-model="settings.showBornName" type="checkbox" />
      </div>
      <div class="field break">
        <label>Born Opacity</label>
        <input
          v-model="settings.bornOpacity"
          type="range"
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useSettings } from '/@/composables/settings'

export default defineComponent({
  setup() {
    const { settings } = useSettings()

    return {
      settings,
    }
  },
})
</script>

<style lang="scss" scoped>
.view-panel {
  text-align: left;
}
h4 {
  margin-bottom: 8px;
}
form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .field {
    margin-bottom: 8px;
    width: 100%;
    display: flex;
    &:last-child {
      margin-bottom: 0;
    }
    &.inline {
      align-items: center;
      > label {
        margin-right: 6px;
      }
      > label + * {
        margin-left: auto;
      }
    }
    &.break {
      flex-direction: column;
      align-items: flex-start;
      > label {
        margin-bottom: 6px;
      }
    }
  }
  input[type='range'] {
    width: 100%;
  }
}
</style>
