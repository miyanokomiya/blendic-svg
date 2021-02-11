<template>
  <div class="root">
    <form v-if="lastSelectedArmature && !lastSelectedBorn" @submit.prevent>
      <label>Name</label>
      <input v-model="draftName" type="text" />
    </form>
    <form v-if="lastSelectedBorn" @submit.prevent>
      <label>Name</label>
      <input v-model="draftName" type="text" />
      <input v-model="connected" type="checkbox" />
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from "vue";
import { useStore } from "/@/store/index";

export default defineComponent({
  setup() {
    const store = useStore();
    const draftName = ref("");

    watch(
      store.lastSelectedArmature,
      () => (draftName.value = store.lastSelectedArmature.value?.name ?? "")
    );
    watch(
      store.lastSelectedBorn,
      () => (draftName.value = store.lastSelectedBorn.value?.name ?? "")
    );

    return {
      draftName,
      lastSelectedArmature: store.lastSelectedArmature,
      lastSelectedBorn: store.lastSelectedBorn,
      connected: computed({
        get(): boolean {
          return store.lastSelectedBorn.value?.connected ?? false;
        },
        set(val: boolean) {
          store.setBornConnection(val);
        },
      }),
    };
  },
});
</script>

<style lang="scss" scoped>
.root {
  border: solid 1px black;
}
</style>
