/*
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
*/

import { IVec2 } from 'okageo'
import { computed, ref } from 'vue'
import { useStore } from '.'
import {
  getAddItem,
  getDeleteItem,
  getSelectItem,
  useListState,
} from '../composables/listState'
import {
  getKeyframeMapByTargetId,
  getKeyframeMapByFrame,
  slideKeyframesTo,
  pastePoseMap,
  getEditedConstraint,
  getEditedKeyframeConstraint,
} from '../utils/animations'
import {
  addPoseTransform,
  getPosedBoneHeadsOrigin,
  getPoseSelectedBones,
  getTransformedBoneMap,
} from '../utils/armatures'
import {
  mapFilter,
  extractMap,
  flatKeyListMap,
  mapReduce,
  toList,
  uniq,
  resetId,
  dropMap,
} from '../utils/commons'
import { getNotDuplicatedName } from '../utils/relations'
import { useHistoryStore } from './history'
import { makeRefAccessors } from '/@/composables/commons'
import {
  getDeleteKeyframesItem,
  getDeleteTargetKeyframeItem,
  getInsertKeyframeItem,
  getUpdateKeyframeItem,
} from '/@/composables/stores/animation'
import { useAnimationFrameStore } from '/@/composables/stores/animationFrame'
import { HistoryItem } from '/@/composables/stores/history'
import { useKeyframeStates } from '/@/composables/stores/keyframeStates'
import {
  TargetPropsState,
  useTargetProps,
} from '/@/composables/stores/targetProps'
import {
  Action,
  Bone,
  getAction,
  getTransform,
  IdMap,
  toTargetIdMap,
  toMap,
  Transform,
  isBoneSelected,
  mergeMap,
} from '/@/models'
import {
  KeyframeBase,
  KeyframeBone,
  KeyframeConstraintPropKey,
  KeyframePropKey,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import {
  BoneConstraint,
  BoneConstraintOption,
  BoneConstraintWithBoneId,
} from '/@/utils/constraints'
import { convolute, getReplaceItem } from '/@/utils/histories'
import {
  getAllSelectedState,
  isAllExistSelected,
  splitKeyframeMapByName,
} from '/@/utils/keyframes'
import {
  getInterpolatedTransformMapByTargetId,
  makeKeyframe,
} from '/@/utils/keyframes/keyframeBone'
import * as keyframeConstraint from '/@/utils/keyframes/keyframeConstraint'

const actions = useListState<Action>('Action')
const editTransforms = ref<IdMap<Transform>>({})
const editConstraints = ref<IdMap<Partial<BoneConstraintOption>>>({})

const historyStore = useHistoryStore()
const store = useStore()

const keyframeList = computed(() => {
  return actions.lastSelectedItem.value?.keyframes ?? []
})

const keyframeMapByFrame = computed(() => {
  return getKeyframeMapByFrame(keyframeList.value)
})

const keyframeMapByTargetId = computed(() => {
  return getKeyframeMapByTargetId(keyframeList.value)
})

const keyframeBoneMapByTargetId = computed(() => {
  return extractMap(keyframeMapByTargetId.value, {
    ...store.boneMap.value,
    ...store.constraintMap.value,
  }) as IdMap<KeyframeBone[]>
})

const visibledKeyframeMapByTargetId = computed(() => {
  return extractMap(keyframeMapByTargetId.value, {
    ...selectedBoneIdMap.value,
    ...selectedConstraintMap.value,
  })
})

const selectedTargetIdMap = computed(() => {
  return {
    ...mapReduce(selectedBoneIdMap.value, () => ({ type: 'bone' })),
    ...mapReduce(selectedConstraintMap.value, () => ({ type: 'constraint' })),
  }
})

const visibledKeyframeMap = computed(() => {
  return toMap(flatKeyListMap(visibledKeyframeMapByTargetId.value))
})

const animationFrameStore = useAnimationFrameStore()
// Note: All bones are visible currently
const targetPropsState = useTargetProps(() => ({}))
const keyframeState = useKeyframeStates(() => visibledKeyframeMap.value)

function initState(initActions: Action[] = []) {
  actions.state.list = initActions
  editTransforms.value = {}
  editConstraints.value = {}
  targetPropsState.clear().redo()
  keyframeState.clear().redo()
}

const visibledSelectedKeyframeMap = computed(() => {
  return extractMap(
    visibledKeyframeMap.value,
    keyframeState.selectedStateMap.value
  )
})
const isAnyVisibledSelectedKeyframe = computed(() => {
  return Object.keys(visibledSelectedKeyframeMap.value).length > 0
})

const lastSelectedKeyframe = computed(() => {
  return visibledSelectedKeyframeMap.value[keyframeState.lastSelectedId.value]
})

const visibledTargetPropsStateMap = computed(() => {
  return extractMap(
    targetPropsState.selectedStateMap.value,
    store.state.selectedBones
  )
})

const splitedKeyframeMapByTargetId = computed(() => {
  return splitKeyframeMapByName(keyframeMapByTargetId.value)
})

const originalInterpolatedConstraintMap = computed<IdMap<BoneConstraint>>(
  () => {
    return keyframeConstraint.getInterpolatedConstraintMap(
      store.constraintMap.value,
      splitedKeyframeMapByTargetId.value.constraint,
      animationFrameStore.currentFrame.value
    )
  }
)

const currentInterpolatedConstraintMap = computed<IdMap<BoneConstraint>>(() => {
  // it is needless to interpolate again if any constraints having keyframes are not edited
  if (Object.keys(editConstraints.value).length === 0) {
    return originalInterpolatedConstraintMap.value
  }

  return keyframeConstraint.getInterpolatedConstraintMap(
    store.constraintMap.value,
    mapReduce(splitedKeyframeMapByTargetId.value.constraint, (list) => {
      return list.map((c) => {
        return getEditedKeyframeConstraint(c, editConstraints.value[c.targetId])
      })
    }),
    animationFrameStore.currentFrame.value
  )
})

const currentInterpolatedTransformMapByTargetId = computed(
  (): IdMap<Transform> => {
    return getInterpolatedTransformMapByTargetId(
      keyframeBoneMapByTargetId.value,
      animationFrameStore.currentFrame.value
    )
  }
)

const posedTargetIds = computed(() => {
  return uniq(
    Object.keys(editTransforms.value).concat(
      Object.keys(keyframeMapByTargetId.value)
    )
  )
})

const currentSelfTransforms = computed((): IdMap<Transform> => {
  return posedTargetIds.value.reduce<IdMap<Transform>>((p, id) => {
    p[id] = addPoseTransform(
      currentInterpolatedTransform(id),
      getBoneEditedTransforms(id)
    )
    return p
  }, {})
})

const currentPosedBones = computed((): IdMap<Bone> => {
  if (!store.lastSelectedArmature.value) return {}
  return getTransformedBoneMap(
    toMap(
      store.lastSelectedArmature.value.bones.map((b) => ({
        ...b,
        transform: getCurrentSelfTransforms(b.id),
        constraints: b.constraints.map(
          (c) => currentInterpolatedConstraintMap.value[c.id]
        ),
      }))
    )
  )
})

const selectedBoneIdMap = computed(() => {
  return mapReduce(
    mapFilter(store.state.selectedBones, (s) => isBoneSelected(s)),
    () => true
  )
})
const selectedBoneMap = computed(() => {
  return mapReduce(selectedBoneIdMap.value, (_, id) => store.boneMap.value[id])
})

const selectedBones = computed(() => {
  return getPoseSelectedBones(
    currentPosedBones.value,
    store.state.selectedBones
  )
})

const selectedPosedBoneOrigin = computed((): IVec2 => {
  if (!store.lastSelectedArmature.value) return { x: 0, y: 0 }
  return getPosedBoneHeadsOrigin(selectedBones.value)
})

const selectedConstraintMapByBoneId = computed<{
  [id: string]: BoneConstraintWithBoneId[]
}>(() => {
  return mapReduce(selectedBoneMap.value, (b) =>
    b.constraints.map((c) => ({ ...c, boneId: b.id }))
  )
})

const selectedConstraintMap = computed<{
  [id: string]: BoneConstraintWithBoneId
}>(() => {
  return toMap(
    toList(selectedConstraintMapByBoneId.value)
      .flat()
      .filter((c) => keyframeMapByTargetId.value[c.id])
  )
})

function setEditedTransforms(mapByTargetId: IdMap<Transform>) {
  historyStore.push(getUpdateEditedTransformsItem(mapByTargetId), true)
}
function applyEditedTransforms(mapByTargetId: IdMap<Transform>) {
  setEditedTransforms(
    mapReduce({ ...editTransforms.value, ...mapByTargetId }, (_p, id) => {
      if (!mapByTargetId[id]) return getBoneEditedTransforms(id)
      return addPoseTransform(getBoneEditedTransforms(id), mapByTargetId[id])
    })
  )
}

function setEditedConstraints(
  mapByTargetId: IdMap<Partial<BoneConstraintOption>>,
  seriesKey?: string
) {
  historyStore.push(
    getUpdateEditedConstraintsItem(mapByTargetId, undefined, seriesKey),
    true
  )
}
function applyEditedConstraint(
  mapByTargetId: IdMap<Partial<BoneConstraintOption>>,
  seriesKey?: string
) {
  setEditedConstraints(
    mergeMap(editConstraints.value, mapByTargetId),
    seriesKey
  )
}

function pastePoses(
  nextPoseMapByTargetId: IdMap<Transform>,
  seriesKey?: string
) {
  const item = getUpdateEditedTransformsItem(
    {
      ...editTransforms.value,
      ...pastePoseMap(nextPoseMapByTargetId, (id) => {
        if (!selectedTargetIdMap.value[id]) return
        return currentInterpolatedTransform(id)
      }),
    },
    'Paste Pose',
    seriesKey
  )
  historyStore.push(item, true)
}

function currentInterpolatedTransform(targetId: string): Transform {
  return (
    currentInterpolatedTransformMapByTargetId.value[targetId] ?? getTransform()
  )
}
function getBoneEditedTransforms(targetId: string): Transform {
  return (
    editTransforms.value[targetId] ?? getTransform({ scale: { x: 0, y: 0 } })
  )
}
function getCurrentSelfTransforms(targetId: string): Transform {
  return currentSelfTransforms.value[targetId] ?? getTransform()
}

function updateCurrentFrame(frameItem?: HistoryItem) {
  if (frameItem) {
    historyStore.push(
      convolute(frameItem, [
        getUpdateEditedTransformsItem({}),
        getUpdateEditedConstraintsItem({}),
      ]),
      true
    )
  }
}
function setCurrentFrame(val: number, seriesKey?: string) {
  updateCurrentFrame(animationFrameStore.setCurrentFrame(val, seriesKey))
}
function jumpStartFrame() {
  updateCurrentFrame(animationFrameStore.jumpStartFrame())
}
function jumpEndFrame() {
  updateCurrentFrame(animationFrameStore.jumpEndFrame())
}
function stepFrame(tickFrame: number, reverse = false, seriesKey?: string) {
  updateCurrentFrame(
    animationFrameStore.stepFrame(tickFrame, reverse, seriesKey)
  )
}
function jumpNextKey() {
  updateCurrentFrame(animationFrameStore.jumpNextKey(keyframeList.value))
}
function jumpPrevKey() {
  updateCurrentFrame(animationFrameStore.jumpPrevKey(keyframeList.value))
}

function setEndFrame(next: number, seriesKey?: string) {
  historyStore.push(animationFrameStore.setEndFrame(next, seriesKey), true)
}

function selectAction(id: string) {
  if (actions.state.lastSelectedId === id) return

  historyStore.push(
    convolute(getSelectItem(actions.state, id), [getSelectKeyframesItem({})]),
    true
  )
}
function addAction() {
  if (!store.lastSelectedArmature.value) return

  const item = convolute(
    getAddItem(
      actions.state,
      getAction(
        {
          name: getNotDuplicatedName(
            'action',
            actions.state.list.map((a) => a.name)
          ),
          armatureId: store.lastSelectedArmature.value.id,
        },
        true
      )
    ),
    [getSelectKeyframesItem({})]
  )
  historyStore.push(item, true)
}
function deleteAction() {
  if (!actions.lastSelectedItem.value) return

  historyStore.push(
    convolute(getDeleteItem(actions.state, actions.lastSelectedIndex.value), [
      getSelectKeyframesItem({}),
    ]),
    true
  )
}

function selectKeyframe(
  keyframeId: string,
  selectedState?: KeyframeSelectedState,
  shift = false
) {
  if (!keyframeId && !isAnyVisibledSelectedKeyframe.value) return

  historyStore.push(
    keyframeId
      ? getSelectKeyframeItem(keyframeId, selectedState, shift)
      : getClearSelectKeyframeItem(),
    true
  )
}
function selectKeyframeByFrame(frame: number, shift = false) {
  const frames = keyframeMapByFrame.value[frame]
  if (frames.length === 0) return

  historyStore.push(getSelectKeyframesItem(toMap(frames), shift), true)
}
function selectAllKeyframes() {
  if (
    Object.keys(visibledSelectedKeyframeMap.value).length ===
      Object.keys(visibledKeyframeMap.value).length &&
    Object.keys(visibledSelectedKeyframeMap.value).every((key) =>
      isAllExistSelected(
        visibledKeyframeMap.value[key],
        keyframeState.selectedStateMap.value[key]
      )
    )
  ) {
    if (isAnyVisibledSelectedKeyframe.value) {
      selectKeyframe('')
    }
  } else {
    historyStore.push(getSelectAllKeyframesItem(), true)
  }
}

function execInsertKeyframe(
  options: {
    translateX?: boolean
    translateY?: boolean
    rotate?: boolean
    scaleX?: boolean
    scaleY?: boolean
  } = {}
) {
  if (!actions.lastSelectedItem.value) {
    addAction()
  }

  const keyframes = Object.keys(selectedBoneIdMap.value).map((targetId) => {
    return makeKeyframe(
      animationFrameStore.currentFrame.value,
      targetId,
      getCurrentSelfTransforms(targetId),
      options,
      true
    )
  })

  historyStore.push(getExecInsertKeyframeItem(keyframes), true)
}
function execDeleteKeyframes() {
  if (!isAnyVisibledSelectedKeyframe.value) return
  historyStore.push(
    getExecDeleteKeyframesItem(keyframeState.selectedStateMap.value),
    true
  )
}
function execDeleteTargetKeyframe(targetId: string, key: KeyframePropKey) {
  historyStore.push(
    getExecDeleteTargetKeyframeItem(
      targetId,
      animationFrameStore.currentFrame.value,
      key
    ),
    true
  )
}

function getCurrentConstraintById(
  constraintId: string
): BoneConstraint | undefined {
  const target = currentInterpolatedConstraintMap.value[constraintId]
  if (!target) return
  return getEditedConstraint(target, editConstraints.value[target.id])
}

function execInsertKeyframeConstraint(
  constraintId: string,
  keys: Partial<
    {
      [key in KeyframeConstraintPropKey]: boolean
    }
  > = {}
) {
  if (Object.keys(selectedBoneIdMap.value).length === 0) return
  if (!actions.lastSelectedItem.value) {
    addAction()
  }

  const target = getCurrentConstraintById(constraintId)
  if (!target) return

  const keyframe = keyframeConstraint.makeKeyframe(
    animationFrameStore.currentFrame.value,
    constraintId,
    target,
    keys,
    true
  )

  historyStore.push(getExecInsertKeyframeItem([keyframe]), true)
}
function execDeleteKeyframeConstraint(
  constraintId: string,
  keys: Partial<
    {
      [key in KeyframeConstraintPropKey]: boolean
    }
  > = {}
) {
  if (!isAnyVisibledSelectedKeyframe.value) return
  historyStore.push(
    getExecDeleteKeyframesItem({
      [constraintId]: { props: keys },
    }),
    true
  )
}

function execUpdateKeyframes(
  keyframes: IdMap<KeyframeBase>,
  seriesKey?: string
) {
  historyStore.push(getExecUpdateKeyframeItem(keyframes, seriesKey), true)
}
function pasteKeyframes(keyframeList: KeyframeBase[]) {
  const item = getExecInsertKeyframeItem(
    slideKeyframesTo(
      keyframeList
        .filter((k) => store.boneMap.value[k.targetId])
        .map((k) => resetId(k)),
      animationFrameStore.currentFrame.value
    )
  )
  historyStore.push(item, true)
}
function completeDuplicateKeyframes(
  duplicatedKeyframeList: KeyframeBase[],
  updatedKeyframeList: KeyframeBase[]
) {
  historyStore.push(
    getCompleteDuplicateKeyframesItem(
      duplicatedKeyframeList,
      updatedKeyframeList
    ),
    true
  )
}

function selectTargetProp(
  targetId: string,
  propsState: TargetPropsState,
  shift = false
) {
  historyStore.push(targetPropsState.select(targetId, propsState, shift), true)
}

export function useAnimationStore() {
  return {
    initState,
    actions: computed(() => actions.state.list),
    actionMap: actions.itemMap,

    selectedKeyframeMap: keyframeState.selectedStateMap,
    lastSelectedKeyframe,
    keyframeMapByFrame,
    keyframeMapByTargetId,
    visibledKeyframeMap,
    visibledSelectedKeyframeMap,
    selectedConstraintMap,
    selectedTargetIdMap,

    visibledTargetPropsStateMap,

    posedTargetIds,
    currentPosedBones,
    selectedBoneIdMap,
    selectedBoneMap,
    selectedBones,
    selectedPosedBoneOrigin,
    getBoneEditedTransforms,
    getCurrentSelfTransforms,
    currentInterpolatedConstraintMap,

    originalInterpolatedConstraintMap,
    applyEditedTransforms,
    applyEditedConstraint,

    pastePoses,

    playing: animationFrameStore.playing,
    setPlaying: animationFrameStore.setPlaying,
    togglePlaying: animationFrameStore.togglePlaying,

    currentFrame: animationFrameStore.currentFrame,
    setCurrentFrame,
    jumpStartFrame,
    jumpEndFrame,
    jumpNextKey,
    jumpPrevKey,
    stepFrame,

    endFrame: animationFrameStore.endFrame,
    setEndFrame,

    selectedAction: actions.lastSelectedItem,
    selectAction,
    addAction,
    deleteAction,
    updateAction: (action: Partial<Action>) => actions.updateItem(action),

    selectKeyframe,
    selectKeyframeByFrame,
    selectAllKeyframes,

    execInsertKeyframe,
    execDeleteKeyframes,
    execDeleteTargetKeyframe,

    execInsertKeyframeConstraint,
    execDeleteKeyframeConstraint,

    execUpdateKeyframes,
    pasteKeyframes,
    completeDuplicateKeyframes,

    selectTargetProp,
  }
}

function getUpdateEditedTransformsItem(
  val: IdMap<Transform>,
  name = 'Update Pose',
  seriesKey?: string
): HistoryItem {
  return getReplaceItem(
    editTransforms.value,
    val,
    (val) => (editTransforms.value = val),
    name,
    seriesKey
  )
}

function getUpdateEditedConstraintsItem(
  val: IdMap<Partial<BoneConstraintOption>>,
  name = 'Update Constraint',
  seriesKey?: string
): HistoryItem {
  return getReplaceItem(
    editConstraints.value,
    val,
    (val) => (editConstraints.value = val),
    name,
    seriesKey
  )
}

function getSelectAllKeyframesItem(): HistoryItem {
  return keyframeState.selectAll(visibledKeyframeMap.value)
}

function getSelectKeyframesItem(
  keyframeMap: IdMap<KeyframeBase>,
  shift = false
): HistoryItem {
  const selectKeyframeItem = keyframeState.selectList(keyframeMap, shift)

  // TODO: select correct props
  const targetPropsItem = targetPropsState.drop(
    Object.keys(keyframeMap).length === 0
      ? toTargetIdMap(toList(visibledKeyframeMap.value))
      : {}
  )

  return convolute(selectKeyframeItem, [targetPropsItem])
}

function getSelectKeyframesPropsItem(
  keyframeMap: IdMap<KeyframeBase>
): HistoryItem {
  const selectKeyframeItem = keyframeState.selectAll(keyframeMap)
  const targetPropsClearItem = targetPropsState.drop(
    toTargetIdMap(toList(visibledKeyframeMap.value))
  )
  return convolute(selectKeyframeItem, [targetPropsClearItem])
}

function getClearSelectKeyframeItem(): HistoryItem {
  return convolute(keyframeState.filter(), [
    targetPropsState.drop(toTargetIdMap(toList(visibledKeyframeMap.value))),
  ])
}

function getSelectKeyframeItem(
  id: string,
  selectedState?: KeyframeSelectedState,
  shift = false
): HistoryItem {
  const keyframe = visibledKeyframeMap.value[id]
  const nextSelectedState = selectedState ?? getAllSelectedState(keyframe)

  return convolute(keyframeState.select(id, nextSelectedState, shift), [
    targetPropsState.select(
      keyframe.targetId,
      { props: mapReduce(nextSelectedState.props, () => 'selected') },
      shift,
      true
    ),
  ])
}

function getKeyframeAccessor() {
  return {
    get: () => actions.lastSelectedItem.value!.keyframes,
    set: (val: KeyframeBase[]) =>
      (actions.lastSelectedItem.value!.keyframes = val),
  }
}

function getVisibledKeyframeAccessor() {
  return {
    get: () => toList(visibledKeyframeMap.value),
    set: (val: KeyframeBase[]) => {
      actions.lastSelectedItem.value!.keyframes = [
        ...toList(
          dropMap(
            toMap(actions.lastSelectedItem.value!.keyframes),
            visibledKeyframeMap.value
          )
        ),
        ...val,
      ]
    },
  }
}

function getExecInsertKeyframeItem(
  keyframes: KeyframeBase[],
  replace = false,
  notSelect = false
) {
  return convolute(
    getInsertKeyframeItem(
      getKeyframeAccessor(),
      makeRefAccessors(editTransforms),
      keyframes,
      replace
    ),
    [!notSelect ? getSelectKeyframesPropsItem(toMap(keyframes)) : undefined]
  )
}

function getExecDeleteKeyframesItem(
  selectedStateMap: IdMap<KeyframeSelectedState>
): HistoryItem {
  return convolute(
    getDeleteKeyframesItem(getVisibledKeyframeAccessor(), selectedStateMap),
    [getSelectKeyframesItem({})]
  )
}

function getExecDeleteTargetKeyframeItem(
  targetId: string,
  targetFrame: number,
  key: KeyframePropKey
): HistoryItem | undefined {
  const item = getDeleteTargetKeyframeItem(
    getVisibledKeyframeAccessor(),
    targetId,
    targetFrame,
    key
  )
  if (!item) return

  return convolute(item, [getSelectKeyframesItem({})])
}

function getExecUpdateKeyframeItem(
  keyframes: IdMap<KeyframeBase>,
  seriesKey?: string
) {
  return getUpdateKeyframeItem(
    getVisibledKeyframeAccessor(),
    keyframes,
    seriesKey
  )
}

function getCompleteDuplicateKeyframesItem(
  duplicatedKeyframeList: KeyframeBase[],
  updatedKeyframeList: KeyframeBase[]
) {
  return convolute(
    getExecInsertKeyframeItem(duplicatedKeyframeList, true, true),
    [getExecUpdateKeyframeItem(toMap(updatedKeyframeList))],
    'Duplicate Keyframe'
  )
}
