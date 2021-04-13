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
  findNextFrameWithKeyframe,
  findPrevFrameWithKeyframe,
  getKeyframeMapByTargetId,
  getKeyframeMapByFrame,
  slideKeyframesTo,
  pastePoseMap,
} from '../utils/animations'
import {
  convolutePoseTransforms,
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
} from '../utils/commons'
import { getNextName } from '../utils/relations'
import { useHistoryStore } from './history'
import { makeRefAccessors } from '/@/composables/commons'
import {
  getDeleteKeyframesItem,
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
} from '/@/models'
import {
  getKeyframeBone,
  KeyframeBase,
  KeyframeSelectedState,
} from '/@/models/keyframe'
import { convolute } from '/@/utils/histories'
import { getAllSelectedState, isAllExistSelected } from '/@/utils/keyframes'
import {
  getInterpolatedTransformMapByTargetId,
  makeKeyframe,
} from '/@/utils/keyframes/keyframeBone'

const actions = useListState<Action>('Action')
const editTransforms = ref<IdMap<Transform>>({})

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

const visibledKeyframeMapByTargetId = computed(() => {
  return extractMap(keyframeMapByTargetId.value, selectedBoneIdMap.value)
})

const visibledKeyframeMap = computed(() => {
  return toMap(flatKeyListMap(visibledKeyframeMapByTargetId.value))
})

const animationFrameStore = useAnimationFrameStore()
const targetPropsState = useTargetProps(() => store.state.selectedBones)
const keyframeState = useKeyframeStates(() => visibledKeyframeMap.value)

function initState(initActions: Action[] = []) {
  actions.state.list = initActions
  editTransforms.value = {}
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

const currentInterpolatedTransformMapByTargetId = computed(
  (): IdMap<Transform> => {
    return getInterpolatedTransformMapByTargetId(
      keyframeMapByTargetId.value,
      animationFrameStore.currentFrame.value
    )
  }
)

const posedTargetIds = computed(() => {
  return Array.from(
    new Set(
      Object.keys(editTransforms.value).concat(
        Object.keys(keyframeMapByTargetId.value)
      )
    )
  )
})

const currentSelfTransforms = computed(
  (): IdMap<Transform> => {
    return posedTargetIds.value.reduce<IdMap<Transform>>((p, id) => {
      p[id] = convolutePoseTransforms([
        currentInterpolatedTransform(id),
        getBoneEditedTransforms(id),
      ])
      return p
    }, {})
  }
)

const currentPosedBones = computed(
  (): IdMap<Bone> => {
    if (!store.lastSelectedArmature.value) return {}
    return getTransformedBoneMap(
      toMap(
        store.lastSelectedArmature.value.bones.map((b) => {
          return {
            ...b,
            transform: getCurrentSelfTransforms(b.id),
          }
        })
      )
    )
  }
)

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

const selectedPosedBoneOrigin = computed(
  (): IVec2 => {
    if (!store.lastSelectedArmature.value) return { x: 0, y: 0 }
    return getPosedBoneHeadsOrigin(selectedBones.value)
  }
)

function setEditedTransforms(mapByTargetId: IdMap<Transform>) {
  historyStore.push(getUpdateEditedTransformsItem(mapByTargetId), true)
}
function applyEditedTransforms(mapByTargetId: IdMap<Transform>) {
  setEditedTransforms(
    mapReduce({ ...editTransforms.value, ...mapByTargetId }, (_p, id) => {
      return convolutePoseTransforms([
        getBoneEditedTransforms(id),
        mapByTargetId[id] ?? getTransform(),
      ])
    })
  )
}
function pastePoses(mapByTargetId: IdMap<Transform>, seriesKey?: string) {
  const item = getUpdateEditedTransformsItem(
    {
      ...editTransforms.value,
      ...pastePoseMap(
        mapByTargetId,
        (id) => currentInterpolatedTransformMapByTargetId.value[id]
      ),
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
  return editTransforms.value[targetId] ?? getTransform()
}
function getCurrentSelfTransforms(targetId: string): Transform {
  return currentSelfTransforms.value[targetId] ?? getTransform()
}

function updateCurrentFrame(frameItem?: HistoryItem) {
  if (frameItem) {
    historyStore.push(
      convolute(frameItem, [getUpdateEditedTransformsItem({})]),
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
  setCurrentFrame(
    findNextFrameWithKeyframe(
      keyframeList.value,
      animationFrameStore.currentFrame.value
    )
  )
}
function jumpPrevKey() {
  setCurrentFrame(
    findPrevFrameWithKeyframe(
      keyframeList.value,
      animationFrameStore.currentFrame.value
    )
  )
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
          name: getNextName(
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
    getSelectKeyframeItem(keyframeId, selectedState, shift),
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
    useTranslate?: boolean
    useRotate?: boolean
    useScale?: boolean
  } = {}
) {
  if (Object.keys(selectedBoneIdMap.value).length === 0) return
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
  historyStore.push(getExecDeleteKeyframesItem(), true)
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
        .map((k) => getKeyframeBone(k, true)),
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
    selectedKeyframeMap: keyframeState.selectedStateMap,
    lastSelectedKeyframe,
    keyframeMapByFrame,
    keyframeMapByTargetId,
    visibledKeyframeMap,
    visibledSelectedKeyframeMap,

    visibledTargetPropsStateMap,

    posedTargetIds,
    currentPosedBones,
    selectedBoneIdMap,
    selectedBoneMap,
    selectedBones,
    selectedPosedBoneOrigin,
    getCurrentSelfTransforms,

    applyEditedTransforms,
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
  const current = { ...editTransforms.value }

  const redo = () => {
    editTransforms.value = val
  }
  return {
    name,
    undo: () => {
      editTransforms.value = current
    },
    redo,
    seriesKey,
  }
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

function getSelectKeyframeItem(
  id: string,
  selectedState?: KeyframeSelectedState,
  shift = false
): HistoryItem {
  const selectKeyframeItem = keyframeState.select(
    id,
    selectedState ??
      (id ? getAllSelectedState(visibledKeyframeMap.value[id]) : { props: {} }),
    shift
  )

  const keyframe = visibledKeyframeMap.value[id]
  const propsItem = !id
    ? targetPropsState.drop(toTargetIdMap(toList(visibledKeyframeMap.value)))
    : targetPropsState.select(
        keyframe.targetId,
        {
          props: mapReduce(
            (selectedState ?? getAllSelectedState(keyframe)).props,
            () => 'selected'
          ),
        },
        shift,
        true
      )

  return convolute(selectKeyframeItem, [propsItem])
}

function getKeyframeAccessor() {
  return {
    get: () => actions.lastSelectedItem.value!.keyframes,
    set: (val: KeyframeBase[]) =>
      (actions.lastSelectedItem.value!.keyframes = val),
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

function getExecDeleteKeyframesItem() {
  return convolute(
    getDeleteKeyframesItem(
      getKeyframeAccessor(),
      keyframeState.selectedStateMap.value
    ),
    [getSelectKeyframesItem({})]
  )
}

function getExecUpdateKeyframeItem(
  keyframes: IdMap<KeyframeBase>,
  seriesKey?: string
) {
  return getUpdateKeyframeItem(getKeyframeAccessor(), keyframes, seriesKey)
}

function getCompleteDuplicateKeyframesItem(
  duplicatedKeyframeList: KeyframeBase[],
  updatedKeyframeList: KeyframeBase[]
) {
  return convolute(
    getExecUpdateKeyframeItem(toMap(updatedKeyframeList)),
    [getExecInsertKeyframeItem(duplicatedKeyframeList, true, true)],
    'Duplicate Keyframe'
  )
}
