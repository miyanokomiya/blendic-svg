<template>
  <div class="view-panel">
    <form>
      <h4>View</h4>
      <div class="field inline">
        <label>Born Name</label>
        <input v-model="settings.showBornName" type="checkbox" />
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
.weight-panel {
  text-align: left;
}
h4 {
  margin-bottom: 8px;
}
* + h4 {
  margin-top: 8px;
}
form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .field {
    margin-bottom: 8px;
    width: 100%;
    display: flex;
    align-items: center;
    &:last-child {
      margin-bottom: 0;
    }
    > label {
      margin-right: 6px;
    }
    > label + * {
      margin-left: auto;
    }
  }
}
</style>
