import { ref, reactive, computed } from "vue";
import { IVec2, sub } from "okageo";
import {
  Transform,
  Armature,
  Born,
  getTransform,
  BornSelectedState,
  EditMode,
} from "../models/index";
import {
  findBorn,
  editTransform,
  extrudeFromParent,
  selectBorn,
  updateConnections,
} from "/@/utils/armatures";
import { getNextName } from "/@/utils/relations";

// @ts-ignore
import merge from "just-merge";

type EditMovement = { current: IVec2; start: IVec2 };

interface State {
  selectedBorns: {
    [name: string]: BornSelectedState;
  };
  lastSelectedBornName: string;
  editMode: EditMode;
  editMovement: EditMovement | undefined;
}

export function useBornEditMode() {
  const state = reactive<State>({
    selectedBorns: {},
    lastSelectedBornName: "",
    editMode: "",
    editMovement: undefined,
  });

  const newBornNames = ref<string[]>([]);
  const pastSelectedBorns = ref<{
    [name: string]: BornSelectedState;
  }>();

  const target = ref<Armature>();

  const isAnySelected = computed(() => !!state.lastSelectedBornName);

  const allNames = computed(() => target.value?.borns.map((a) => a.name) ?? []);

  function cancelEdit() {
    if (state.editMode === "extrude") {
      if (target.value) {
        // revert extruded borns
        target.value.borns = target.value.borns.filter(
          (a) => !state.selectedBorns[a.name]
        );
      }
      state.selectedBorns = pastSelectedBorns.value
        ? { ...pastSelectedBorns.value }
        : {};
    }

    state.editMode = "";
    state.editMovement = undefined;
    newBornNames.value = [];

    pastSelectedBorns.value = undefined;
  }

  function cancel() {
    cancelEdit();
    state.editMode = "";
    state.editMovement = undefined;
  }

  function clickAny() {
    if (state.editMode) {
      completeEdit();
    }
  }

  function clickEmpty() {
    if (state.editMode) {
      completeEdit();
    } else {
      state.selectedBorns = {};
      state.lastSelectedBornName = "";
    }
  }

  function extrude(parent: Born, fromHead = false): Born {
    return {
      ...extrudeFromParent(parent, fromHead),
    };
  }

  function addBorn(born: Born) {
    target.value!.borns.push(born);
    newBornNames.value.push(born.name);
    state.selectedBorns[born.name] = { tail: true };
    state.lastSelectedBornName = born.name;
  }

  function setEditMode(mode: EditMode) {
    if (!target.value) return;

    cancelEdit();
    if (isAnySelected.value) {
      state.editMode = mode;
      if (mode === "extrude") {
        pastSelectedBorns.value = { ...state.selectedBorns };
        state.selectedBorns = {};
        const shouldSkipBorns: { [name: string]: boolean } = {};
        Object.keys(pastSelectedBorns.value).forEach((name) => {
          const selectedState = pastSelectedBorns.value![name];
          const parent = findBorn(target.value!.borns, name)!;

          const borns: Born[] = [];
          if (selectedState.tail) {
            borns.push(extrude(parent));
          }
          if (selectedState.head) {
            borns.push(extrude(parent, true));
          }
          borns.forEach((b) => {
            // prevent to extruding from same parent
            if (!shouldSkipBorns[b.parentKey]) {
              b.name = getNextName(parent.name, allNames.value);
              addBorn(b);
              shouldSkipBorns[b.parentKey] = true;
            }
          });
        });
      }
    }
  }

  const editTransforms = computed(() => {
    if (!state.editMovement) return {};

    const translate = sub(state.editMovement.current, state.editMovement.start);
    return Object.keys(state.selectedBorns).reduce<{
      [name: string]: Transform[];
    }>((map, name) => {
      map[name] = [getTransform({ translate })];
      return map;
    }, {});
  });

  function completeEdit() {
    if (!target.value) return;

    Object.keys(editTransforms.value).forEach((name) => {
      const index = target.value!.borns.findIndex((a) => a.name === name);
      if (index === -1) return;
      target.value!.borns[index] = editTransform(
        target.value!.borns[index],
        editTransforms.value[name],
        state.selectedBorns[name]
      );
    });
    target.value.borns = updateConnections(target.value.borns);
    state.editMovement = undefined;
    state.editMode = "";
    pastSelectedBorns.value = undefined;
  }

  function select(name: string, selectedState: BornSelectedState) {
    if (state.editMode) {
      completeEdit();
      return;
    }
    if (!target.value) return;

    state.selectedBorns = selectBorn(target.value, name, selectedState);
    state.lastSelectedBornName = name;
  }

  function shiftSelect(name: string, selectedState: BornSelectedState) {
    if (state.editMode) {
      completeEdit();
      return;
    }
    if (!target.value) return;

    state.selectedBorns = merge(
      state.selectedBorns,
      selectBorn(target.value, name, selectedState)
    );
    state.lastSelectedBornName = name;
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
    begin: (armature: Armature) => (target.value = armature),
    end() {
      cancel();
      target.value = undefined;
    },
    setEditMode,
    select,
    shiftSelect,
    mousemove,
    clickAny,
    clickEmpty,
  };
}
