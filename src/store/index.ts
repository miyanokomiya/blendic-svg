import { reactive, computed } from "vue";
import { Armature, getBorn, getArmature } from "../models/index";

const armature = reactive<Armature>(
  getArmature({
    name: "1",
    borns: [
      getBorn({
        name: "1",
        head: { x: 20, y: 200 },
        tail: { x: 220, y: 200 },
      }),
    ],
  })
);

const state = reactive({
  armatures: [armature],
  lastSelectedArmatureName: "",
  lastSelectedBornName: "",
});

const lastSelectedArmature = computed(() =>
  state.armatures.find((a) => a.name === state.lastSelectedArmatureName)
);
const lastSelectedBorn = computed(() => {
  if (!lastSelectedArmature.value) return;
  return lastSelectedArmature.value.borns.find(
    (b) => b.name === state.lastSelectedBornName
  );
});

function selectArmature(name: string = "") {
  state.lastSelectedArmatureName = name;
  state.lastSelectedBornName = "";
}
function selectBorn(name: string = "") {
  state.lastSelectedBornName = name;
}

export function useStore() {
  return {
    state,
    lastSelectedArmature,
    lastSelectedBorn,
    selectArmature,
    selectBorn,
  };
}
