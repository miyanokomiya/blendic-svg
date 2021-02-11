import { ref, reactive, computed } from "vue";
import { IVec2, sub } from "okageo";
import {
  Transform,
  ArmatureRoot,
  getTransform,
  getArmature,
  getArmatureRoot,
  ArmatureSelectedState,
  EditMode,
  CanvasMode,
} from "../models/index";
import { editTransform } from "../utils/armatures";

type EditMovement = { current: IVec2; start: IVec2 };

interface EditModeMethods {
  setEditMode: (mode: EditMode) => void;
  mousemove: (arg: { current: IVec2; start: IVec2 }) => void;
  grab: () => void;
  rotate: () => void;
  scale: () => void;
  extrude: () => void;
  complete: () => void;
  cancel: () => void;
}

interface State {
  selectedArmatures: {
    [name: string]: ArmatureSelectedState;
  };
  lastSelectedArmatureName: string;
  editMode: EditMode;
  editMovement: EditMovement | undefined;
}

export function useArmatureEditMode() {
  const state = reactive<State>({
    selectedArmatures: {},
    lastSelectedArmatureName: "",
    editMode: "",
    editMovement: undefined,
  });

  const target = ref<ArmatureRoot>();

  const isAnySelected = computed(() => !!state.lastSelectedArmatureName);

  function cancel() {
    state.selectedArmatures = {};
    state.lastSelectedArmatureName = "";
    state.editMode = "";
    state.editMovement = undefined;
  }

  function complete() {
    completeEdit();
    state.editMode = "";
    state.editMovement = undefined;
  }

  function setEditMode(mode: EditMode) {
    if (isAnySelected.value) {
      state.editMode = mode;
    }
  }

  const editTransforms = computed(() => {
    if (!state.editMovement) return {};

    const translate = sub(state.editMovement.current, state.editMovement.start);
    return Object.keys(state.selectedArmatures).reduce<{
      [name: string]: Transform[];
    }>((map, name) => {
      map[name] = [getTransform({ translate })];
      return map;
    }, {});
  });

  function completeEdit() {
    if (!target.value) return;

    Object.keys(editTransforms.value).forEach((name) => {
      const index = target.value!.armatures.findIndex((a) => a.name === name);
      if (index === -1) return;
      target.value!.armatures[index] = editTransform(
        target.value!.armatures[index],
        editTransforms.value[name],
        state.selectedArmatures[name]
      );
    });
    state.editMovement = undefined;
    state.editMode = "";
  }

  function select(name: string, selectedState: ArmatureSelectedState) {
    if (state.editMode) {
      completeEdit();
      return;
    }
    state.selectedArmatures = { [name]: selectedState };
    state.lastSelectedArmatureName = name;
  }

  function shiftSelect(name: string, selectedState: ArmatureSelectedState) {
    if (state.editMode) {
      completeEdit();
      return;
    }
    state.selectedArmatures[name] = selectedState;
    state.lastSelectedArmatureName = name;
  }

  function mousemove(arg: EditMovement) {
    if (state.editMode === "grab") {
      state.editMovement = arg;
    }
  }

  return {
    state,
    getEditTransforms(name: string) {
      return editTransforms.value[name] || [];
    },
    begin: (armatureRoot: ArmatureRoot) => (target.value = armatureRoot),
    end() {
      target.value = undefined;
      cancel();
    },
    setEditMode,
    select,
    shiftSelect,
    mousemove,
    grab: () => {},
    rotate: () => {},
    scale: () => {},
    extrude: () => {},
    complete,
    cancel,
  };
}
