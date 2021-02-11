import { ref, reactive, computed } from "vue";
import { IVec2, sub } from "okageo";
import {
  Transform,
  ArmatureRoot,
  Armature,
  getTransform,
  getArmature,
  ArmatureSelectedState,
  EditMode,
} from "../models/index";
import { editTransform, extrudeFromParent } from "/@/utils/armatures";
import { getNextName } from "/@/utils/relations";

type EditMovement = { current: IVec2; start: IVec2 };

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

  const newArmatureNames = ref<string[]>([]);
  const pastSelectedArmatures = ref<{
    [name: string]: ArmatureSelectedState;
  }>();

  const target = ref<ArmatureRoot>();

  const isAnySelected = computed(() => !!state.lastSelectedArmatureName);

  const allNames = computed(
    () => target.value?.armatures.map((a) => a.name) ?? []
  );

  function clickAny() {
    if (state.editMode) {
      completeEdit();
    }
  }

  function cancelEdit() {
    if (state.editMode === "extrude") {
      if (target.value) {
        // revert extruded armatures
        target.value.armatures = target.value.armatures.filter(
          (a) => !state.selectedArmatures[a.name]
        );
      }
      state.selectedArmatures = pastSelectedArmatures.value
        ? { ...pastSelectedArmatures.value }
        : {};
    }

    state.editMode = "";
    state.editMovement = undefined;
    newArmatureNames.value = [];

    pastSelectedArmatures.value = undefined;
  }

  function cancel() {
    cancelEdit();
    state.editMode = "";
    state.editMovement = undefined;
  }

  function complete() {
    completeEdit();
  }

  function getArmature(name: string): Armature | undefined {
    return target.value?.armatures.find((a) => a.name === name);
  }

  function extrude(parent: Armature, fromHead = false) {
    const extruded = {
      ...extrudeFromParent(parent, fromHead),
      name: getNextName(parent.name, allNames.value),
    };
    target.value!.armatures.push(extruded);
    newArmatureNames.value.push(extruded.name);
    state.selectedArmatures[extruded.name] = "tail";
  }

  function setEditMode(mode: EditMode) {
    if (!target.value) return;

    cancelEdit();
    if (isAnySelected.value) {
      state.editMode = mode;
      if (mode === "extrude") {
        pastSelectedArmatures.value = { ...state.selectedArmatures };
        state.selectedArmatures = {};
        Object.keys(pastSelectedArmatures.value).forEach((name) => {
          const selectedState = pastSelectedArmatures.value![name];
          const parent = getArmature(name)!;

          if (selectedState === "tail") {
            extrude(parent);
          } else if (selectedState === "head") {
            extrude(parent, true);
          } else {
            extrude(parent);
            extrude(parent, true);
          }
        });
      }
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
    pastSelectedArmatures.value = undefined;
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
    if (state.editMode) {
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
      cancel();
      target.value = undefined;
    },
    setEditMode,
    select,
    shiftSelect,
    mousemove,
    clickAny,
    complete,
  };
}
