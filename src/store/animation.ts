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

import { IVec2, sub } from 'okageo'
import { computed, ref } from 'vue'
import { IndexStore, useStore } from '.'
import {
  getKeyframeMapByTargetId,
  getKeyframeMapByFrame,
  slideKeyframesTo,
  pastePoseMap,
  getEditedConstraint,
  getEditedKeyframeConstraint,
  mergeKeyframesWithDropped,
  resetTransformByKeyframeMap,
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
  toKeyListMap,
  toKeyMap,
  regenerateIdMap,
} from '../utils/commons'
import { getNotDuplicatedName } from '../utils/relations'
import { useHistoryStore } from './history'
import { useEntities } from '/@/composables/stores/entities'
import { useItemSelectable } from '/@/composables/stores/selectable'
import { useAnimationFrameStore } from '/@/composables/stores/animationFrame'
import { HistoryStore } from '/@/composables/stores/history'
import { useKeyframeStates } from '/@/composables/stores/keyframeStates'
import { useMapStore } from '/@/composables/stores/mapStore'
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
import { fromEntityList, toEntityList } from '/@/models/entity'
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
import {
  deleteKeyframeByProp,
  getAllSelectedState,
  isAllExistSelected,
  moveKeyframe,
  SplitedKeyframeMapBySelected,
  splitKeyframeMapByName,
  splitKeyframeMapBySelected,
} from '/@/utils/keyframes'
import {
  getInterpolatedTransformMapByTargetId,
  makeKeyframe,
} from '/@/utils/keyframes/keyframeBone'
import * as keyframeConstraint from '/@/utils/keyframes/keyframeConstraint'
import * as okahistory from 'okahistory'
import { EditMovement } from '/@/composables/modes/types'
import { canvasToFrameValue } from '/@/utils/animations'
import { useSettings } from '/@/composables/settings'

export function createStore(
  historyStore: HistoryStore,
  indexStore: IndexStore,
  options?: {
    graphValueWidth: () => number
  }
) {
  const actionEntities = useEntities<Action>('Action')
  const keyframeEntities = useEntities<KeyframeBase>('Keyframe')

  const actionSelectable = useItemSelectable(
    'Action',
    () => actionEntities.entities.value.byId
  )
  const animationFrameStore = useAnimationFrameStore()
  const editTransformsStore = useMapStore<Transform>('BonePose')
  const editConstraintsStore =
    useMapStore<Partial<BoneConstraintOption>>('ConstraintPose')

  // Note: All bones are visible currently
  const targetPropsState = useTargetProps('PoseTarget', () => targetMap.value)
  const keyframeState = useKeyframeStates(
    'Keyframe',
    () => visibledKeyframeMap.value
  )

  historyStore.defineReducers(actionEntities.reducers)
  historyStore.defineReducers(keyframeEntities.reducers)
  historyStore.defineReducers(actionSelectable.reducers)
  historyStore.defineReducers(animationFrameStore.reducers)
  historyStore.defineReducers(editTransformsStore.reducers)
  historyStore.defineReducers(editConstraintsStore.reducers)
  historyStore.defineReducers(targetPropsState.reducers)
  historyStore.defineReducers(keyframeState.reducers)

  const actions = computed(() => toEntityList(actionEntities.entities.value))
  const lastSelectedActionId = actionSelectable.lastSelectedId
  const lastSelectedAction = computed(() =>
    lastSelectedActionId.value
      ? actionEntities.entities.value.byId[lastSelectedActionId.value]
      : undefined
  )

  const editTransforms = editTransformsStore.state
  const editConstraints = editConstraintsStore.state

  const keyframeList = computed(() => {
    const byId = keyframeEntities.entities.value.byId
    return lastSelectedAction.value?.keyframes.map((id) => byId[id]) ?? []
  })

  const keyframeMapByFrame = computed(() => {
    return getKeyframeMapByFrame(keyframeList.value)
  })

  const keyframeMapByTargetId = computed(() => {
    return getKeyframeMapByTargetId(keyframeList.value)
  })

  const targetMap = computed(() => ({
    ...indexStore.boneMap.value,
    ...indexStore.constraintMap.value,
  }))

  const keyframeBoneMapByTargetId = computed(() => {
    return extractMap(keyframeMapByTargetId.value, targetMap.value) as IdMap<
      KeyframeBone[]
    >
  })

  const visibledKeyframeMapByTargetId = computed(() => {
    return extractMap(keyframeMapByTargetId.value, {
      ...selectedBoneIdMap.value,
      ...selectedConstraintMap.value,
    })
  })

  const selectedTargetIdMap = computed(() => {
    return {
      ...mapReduce(selectedBoneIdMap.value, () => ({ type: 'bone' }) as const),
      ...mapReduce(
        selectedConstraintMap.value,
        () => ({ type: 'constraint' }) as const
      ),
    }
  })

  const visibledKeyframeMap = computed(() => {
    return toMap(flatKeyListMap(visibledKeyframeMapByTargetId.value))
  })

  function initState(
    initialCurrentFrame: number,
    initialEndFrame: number,
    initActions: Action[],
    initKeyframes: KeyframeBase[],
    actionSelected: [string, true][],
    initKeyframeState: [string, KeyframeSelectedState][],
    inittargetPropsState: [string, TargetPropsState][]
  ) {
    animationFrameStore.setPlaying('pause')
    animationFrameStore.restore(initialCurrentFrame, initialEndFrame)
    actionEntities.init(fromEntityList(initActions))
    keyframeEntities.init(fromEntityList(initKeyframes))
    actionSelectable.restore(actionSelected)
    editTransformsStore.init()
    editConstraintsStore.init()
    keyframeState.restore(initKeyframeState)
    targetPropsState.restore(inittargetPropsState)
  }

  function exportState() {
    return {
      currentFrame: animationFrameStore.currentFrame.value,
      endFrame: animationFrameStore.endFrame.value,
      actions: actions.value,
      keyframes: toEntityList(keyframeEntities.entities.value),
      actionSelected: actionSelectable.createSnapshot(),
      keyframeState: keyframeState.createSnapshot(),
      targetPropsState: targetPropsState.createSnapshot(),
    }
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
      selectedTargetIdMap.value
    )
  })

  const splitedKeyframeMapByTargetId = computed(() => {
    return splitKeyframeMapByName(keyframeMapByTargetId.value)
  })

  const originalInterpolatedConstraintMap = computed<IdMap<BoneConstraint>>(
    () => {
      return keyframeConstraint.getInterpolatedConstraintMap(
        indexStore.constraintMap.value,
        splitedKeyframeMapByTargetId.value.constraint,
        animationFrameStore.currentFrame.value
      )
    }
  )

  const currentInterpolatedConstraintMap = computed<IdMap<BoneConstraint>>(
    () => {
      // it is needless to interpolate again if any constraints having keyframes are not edited
      if (Object.keys(editConstraints.value).length === 0) {
        return originalInterpolatedConstraintMap.value
      }

      return keyframeConstraint.getInterpolatedConstraintMap(
        indexStore.constraintMap.value,
        mapReduce(splitedKeyframeMapByTargetId.value.constraint, (list) => {
          return list.map((c) => {
            return getEditedKeyframeConstraint(
              c,
              editConstraints.value[c.targetId]
            )
          })
        }),
        animationFrameStore.currentFrame.value
      )
    }
  )

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
    if (!indexStore.lastSelectedArmature.value) return {}

    return getTransformedBoneMap(
      mapReduce(indexStore.boneMap.value, (b) => ({
        ...b,
        transform: getCurrentSelfTransforms(b.id),
      })),
      currentInterpolatedConstraintMap.value
    )
  })

  const selectedBoneIdMap = computed(() => {
    return mapReduce(
      mapFilter(indexStore.selectedBones.value, (s) => isBoneSelected(s)),
      () => true
    )
  })
  const selectedBoneMap = computed(() => {
    return mapReduce(
      selectedBoneIdMap.value,
      (_, id) => indexStore.boneMap.value[id]
    )
  })

  const selectedBones = computed(() => {
    return getPoseSelectedBones(
      currentPosedBones.value,
      indexStore.selectedBones.value
    )
  })

  const selectedPosedBoneOrigin = computed((): IVec2 => {
    if (!indexStore.lastSelectedArmature.value) return { x: 0, y: 0 }
    return getPosedBoneHeadsOrigin(selectedBones.value)
  })

  const selectedConstraintMapByBoneId = computed<{
    [id: string]: BoneConstraintWithBoneId[]
  }>(() => {
    const map = indexStore.constraintMap.value
    return mapReduce(selectedBoneMap.value, (b) =>
      b.constraints.map((cid) => ({ ...map[cid], boneId: b.id }))
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
    historyStore.dispatch(editTransformsStore.createSetAction(mapByTargetId))
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
    historyStore.dispatch(
      editConstraintsStore.createSetAction(mapByTargetId, seriesKey)
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
    historyStore.dispatch(
      editTransformsStore.createSetAction(
        {
          ...editTransforms.value,
          ...pastePoseMap(nextPoseMapByTargetId, (id) => {
            if (!selectedTargetIdMap.value[id]) return
            return currentInterpolatedTransform(id)
          }),
        },
        seriesKey
      )
    )
  }

  function currentInterpolatedTransform(targetId: string): Transform {
    return (
      currentInterpolatedTransformMapByTargetId.value[targetId] ??
      getTransform()
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

  function updateCurrentFrame(frameItem?: okahistory.Action<unknown>) {
    if (frameItem) {
      historyStore.dispatch(frameItem, [
        editTransformsStore.createSetAction({}),
        editConstraintsStore.createSetAction({}),
      ])
    }
  }

  function setCurrentFrame(val: number, seriesKey?: string) {
    updateCurrentFrame(
      animationFrameStore.createUpdateCurrentFrameAction(val, seriesKey)
    )
  }
  function jumpStartFrame() {
    updateCurrentFrame(animationFrameStore.createJumpStartFrameAction())
  }
  function jumpEndFrame() {
    updateCurrentFrame(animationFrameStore.createJumpEndFrameAction())
  }
  function stepFrame(tickFrame: number, reverse = false, seriesKey?: string) {
    updateCurrentFrame(
      animationFrameStore.createStepFrameAction(tickFrame, reverse, seriesKey)
    )
  }
  function jumpNextKey() {
    updateCurrentFrame(
      animationFrameStore.createJumpNextKeyAction(keyframeList.value)
    )
  }
  function jumpPrevKey() {
    updateCurrentFrame(
      animationFrameStore.createJumpPrevKeyAction(keyframeList.value)
    )
  }

  function setEndFrame(next: number, seriesKey?: string) {
    historyStore.dispatch(
      animationFrameStore.createUpdateEndFrameAction(next, seriesKey)
    )
  }

  function selectAction(id: string) {
    if (lastSelectedActionId.value === id) return

    historyStore.dispatch(actionSelectable.createSelectAction(id), [
      keyframeState.createClearAllAction(),
    ])
  }

  function addAction(id?: string) {
    if (!indexStore.lastSelectedArmature.value) return

    const action = getAction(
      {
        id,
        name: getNotDuplicatedName(
          'action',
          actions.value.map((a) => a.name)
        ),
        armatureId: indexStore.lastSelectedArmature.value.id,
      },
      !id
    )

    historyStore.dispatch(actionEntities.createAddAction([action]), [
      keyframeState.createClearAllAction(),
      actionSelectable.createSelectAction(action.id),
    ])
  }

  function updateAction(action: Partial<Action>) {
    if (!lastSelectedActionId.value) return

    historyStore.dispatch(
      actionEntities.createUpdateAction({
        [lastSelectedActionId.value]: action,
      })
    )
  }

  function deleteAction() {
    const action = lastSelectedAction.value
    if (!action) return

    historyStore.dispatch(actionEntities.createDeleteAction([action.id]), [
      keyframeEntities.createDeleteAction(action.keyframes),
      keyframeState.createClearAllAction(),
    ])
  }

  function selectKeyframe(
    keyframeId: string,
    selectedState?: KeyframeSelectedState,
    shift = false
  ) {
    if (!keyframeId && !isAnyVisibledSelectedKeyframe.value) return

    if (keyframeId) {
      const [head, ...body] = createSelectKeyframeActions(
        keyframeId,
        selectedState,
        shift
      )
      historyStore.dispatch(head, body)
    } else {
      const [head, ...body] = getClearSelectKeyframeItem()
      historyStore.dispatch(head, body)
    }
  }

  function selectKeyframes(
    selectedState: IdMap<KeyframeSelectedState> = {},
    shift = false
  ) {
    const hasItem = Object.keys(selectedState).length > 0
    if (!hasItem && !isAnyVisibledSelectedKeyframe.value) return

    if (hasItem) {
      historyStore.dispatch(
        keyframeState.createMultiSelectAction(
          mapReduce(selectedState, (k, id) => ({
            id,
            points: mapReduce(k.props, () => true),
          })),
          shift
        ),
        [targetPropsState.createClearAllAction()]
      )
    } else {
      const [head, ...body] = getClearSelectKeyframeItem()
      historyStore.dispatch(head, body)
    }
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
      historyStore.dispatch(getSelectAllKeyframesItem())
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
    if (!lastSelectedAction.value) {
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

    const [head, ...body] = createInsertKeyframeActions(keyframes)
    historyStore.dispatch(head, body)
  }
  function execDeleteKeyframes() {
    if (!isAnyVisibledSelectedKeyframe.value) return

    const [head, ...body] = createExecDeleteKeyframesActions(
      keyframeState.selectedStateMap.value
    )
    historyStore.dispatch(head, body)
  }
  function execDeleteTargetKeyframe(targetId: string, key: KeyframePropKey) {
    const [head, ...body] = createExecDeleteTargetKeyframeActions(
      targetId,
      animationFrameStore.currentFrame.value,
      key
    )
    historyStore.dispatch(head, body)
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
    keys: Partial<{
      [key in KeyframeConstraintPropKey]: boolean
    }> = {}
  ) {
    if (Object.keys(selectedBoneIdMap.value).length === 0) return
    if (!lastSelectedAction.value) {
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

    const [head, ...body] = createInsertKeyframeActions([keyframe])
    historyStore.dispatch(head, body)
  }

  function execDeleteKeyframeConstraint(
    constraintId: string,
    keys: Partial<{
      [key in KeyframeConstraintPropKey]: boolean
    }> = {}
  ) {
    if (!isAnyVisibledSelectedKeyframe.value) return

    const [head, ...body] = createExecDeleteKeyframesActions({
      [constraintId]: { props: keys },
    })
    historyStore.dispatch(head, body)
  }

  function execUpdateKeyframes(
    keyframes: IdMap<KeyframeBase>,
    seriesKey?: string
  ) {
    const [head, ...body] = createUpsertKeyframeActions(
      toList(keyframes),
      true,
      seriesKey
    )
    historyStore.dispatch(head, body)
  }

  function pasteKeyframes(keyframeList: KeyframeBase[]) {
    const [head, ...body] = createInsertKeyframeActions(
      slideKeyframesTo(
        keyframeList
          .filter((k) => indexStore.boneMap.value[k.targetId])
          .map((k) => resetId(k)),
        animationFrameStore.currentFrame.value
      )
    )
    historyStore.dispatch(head, body)
  }

  /**
   * items in `updatedList` will be selected by this operation
   */
  function upsertKeyframes(
    createdList: KeyframeBase[],
    updatedList: KeyframeBase[] = []
  ) {
    if (createdList.length === 0) {
      // Needless to upsert if no new items exist
      execUpdateKeyframes(toMap(updatedList))
      return
    }

    const [head, ...body] = createUpsertKeyframeActions(
      [...createdList, ...updatedList],
      true
    )

    const createdByFrame = toKeyListMap(createdList, 'frame')
    const selectedMap: IdMap<KeyframeBase> = {}

    // items in `updatedList` may be deleted by merging with a item in `createdList`
    // => select the item having the same position in createdList
    updatedList.forEach((u) => {
      const byTargetId = toKeyMap(createdByFrame[u.frame] ?? [], 'targetId')
      const c = byTargetId[u.targetId]
      selectedMap[c?.id ?? u.id] = u
    })

    historyStore.dispatch(head, [
      ...body,
      keyframeState.createMultiSelectAction(selectedMap),
    ])
  }

  function selectTargetProp(
    targetId: string,
    propsState: TargetPropsState,
    shift = false
  ) {
    if (!targetPropsState.selectDryRun(targetId, propsState, shift)) return
    historyStore.dispatch(
      targetPropsState.createSelectAction(targetId, propsState, shift)
    )
  }

  const editMovement = ref<EditMovement>()
  const tmpKeyframes = ref<IdMap<KeyframeBase>>()

  const keyframeSelectedInfoSet = computed<SplitedKeyframeMapBySelected>(() => {
    const splited = splitKeyframeMapBySelected(
      visibledKeyframeMap.value,
      extractMap(
        keyframeState.selectedStateMap.value,
        visibledKeyframeMap.value
      )
    )
    return {
      selected: splited.selected,
      notSelected: regenerateIdMap(splited.notSelected),
    }
  })

  const editedKeyframeMap = computed<SplitedKeyframeMapBySelected | undefined>(
    () => {
      if (editMovement.value) {
        // In case of grabbing keyframes
        const diff = canvasToFrameValue(
          sub(editMovement.value.current, editMovement.value.start),
          options?.graphValueWidth() ?? 1
        )
        return {
          selected: mapReduce(
            keyframeSelectedInfoSet.value.selected,
            (keyframe) => moveKeyframe(keyframe, diff)
          ),
          notSelected: {
            ...keyframeSelectedInfoSet.value.notSelected,
            ...(tmpKeyframes.value ?? {}),
          },
        }
      } else if (tmpKeyframes.value) {
        // In case of modifying keyframes without `editMovement`
        // => Being modified keyframes are in `tmpKeyframes`
        // => e.g. Moving curve controls
        return {
          selected: tmpKeyframes.value,
          notSelected: {},
        }
      } else {
        return undefined
      }
    }
  )

  function getEditMovement(): EditMovement | undefined {
    return editMovement.value
  }
  function setEditMovement(val?: EditMovement): void {
    editMovement.value = val
  }
  function completeEdit(): void {
    if (editedKeyframeMap.value) {
      upsertKeyframes(
        toList(editedKeyframeMap.value.notSelected),
        toList(editedKeyframeMap.value.selected)
      )
    }
    tmpKeyframes.value = undefined
  }
  function setTmpKeyframes(val?: IdMap<KeyframeBase>) {
    tmpKeyframes.value = val
  }

  return {
    initState,
    exportState,
    actions,
    actionMap: computed(() => toMap(actions.value)),

    keyframes: keyframeList,

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

    selectedAction: lastSelectedAction,
    selectAction,
    addAction,
    updateAction,
    deleteAction,

    selectKeyframe,
    selectKeyframes,
    selectAllKeyframes,

    execInsertKeyframe,
    execDeleteKeyframes,
    execDeleteTargetKeyframe,

    execInsertKeyframeConstraint,
    execDeleteKeyframeConstraint,

    execUpdateKeyframes,
    pasteKeyframes,
    upsertKeyframes,

    selectTargetProp,

    editedKeyframeMap,
    getEditMovement,
    setEditMovement,
    completeEdit,
    setTmpKeyframes,
  }

  function getSelectAllKeyframesItem(): okahistory.Action<unknown> {
    return keyframeState.createSelectAllAction(visibledKeyframeMap.value)
  }

  function getClearSelectKeyframeItem(): okahistory.Action<unknown>[] {
    return [
      keyframeState.createFilterAction(),
      targetPropsState.createDropAction(
        toTargetIdMap(toList(visibledKeyframeMap.value))
      ),
    ]
  }

  function createSelectKeyframeActions(
    id: string,
    selectedState?: KeyframeSelectedState,
    shift = false
  ): okahistory.Action<unknown>[] {
    const keyframe = visibledKeyframeMap.value[id]
    const nextSelectedState = selectedState ?? getAllSelectedState(keyframe)

    return [
      keyframeState.createSelectAction(id, nextSelectedState, shift),
      targetPropsState.createSelectAction(
        keyframe.targetId,
        { props: mapReduce(nextSelectedState.props, () => 'selected') },
        shift,
        true
      ),
    ]
  }

  function createInsertKeyframeActions(
    keyframes: KeyframeBase[],
    replace = false
  ): (okahistory.Action<unknown> | undefined)[] {
    return [
      ...createUpsertKeyframeActions(keyframes, !replace),
      editTransformsStore.createSetAction(
        resetTransformByKeyframeMap(
          editTransforms.value,
          toTargetIdMap(keyframes)
        )
      ),
      keyframeState.createSelectAllAction(toMap(keyframes)),
      targetPropsState.createDropAction(
        toTargetIdMap(toList(visibledKeyframeMap.value))
      ),
    ]
  }

  function createUpsertKeyframeActions(
    replaced: KeyframeBase[],
    mergeDeep = false,
    seriesKey?: string
  ): okahistory.Action<unknown>[] {
    const current = visibledKeyframeMap.value

    const { merged, dropped } = mergeKeyframesWithDropped(
      toList(current),
      replaced,
      mergeDeep
    )

    const mergedMap = toMap(merged)

    const createdMap = dropMap(mergedMap, current)
    const updatedMap = extractMap(mergedMap, current)
    const deletedMap = dropMap(toMap(dropped), mergedMap)

    const createdList = toList(createdMap)

    return [
      { ...keyframeEntities.createAddAction(createdList), seriesKey },
      keyframeEntities.createDeleteAction(toList(deletedMap).map((k) => k.id)),
      keyframeEntities.createUpdateAction(updatedMap),
      actionEntities.createUpdateAction({
        [lastSelectedAction.value!.id]: {
          keyframes: lastSelectedAction
            .value!.keyframes.filter((id) => !deletedMap[id])
            .concat(createdList.map((k) => k.id)),
        },
      }),
      keyframeState.createDropAction(deletedMap),
    ]
  }

  function createExecDeleteKeyframesActions(
    selectedStateMap: IdMap<KeyframeSelectedState>
  ): okahistory.Action<unknown>[] {
    const visibled = visibledKeyframeMap.value
    const targetMap = extractMap(visibled, selectedStateMap)

    const updatedMap: IdMap<KeyframeBase> = {}
    const deletedMap: IdMap<true> = {}

    toList(targetMap).forEach((item) => {
      const updated = deleteKeyframeByProp(item, selectedStateMap[item.id])
      if (updated) {
        updatedMap[updated.id] = updated
      } else {
        deletedMap[item.id] = true
      }
    })

    return [
      keyframeEntities.createUpdateAction(updatedMap),
      keyframeEntities.createDeleteAction(Object.keys(deletedMap)),
      actionEntities.createUpdateAction({
        [lastSelectedAction.value!.id]: {
          keyframes: lastSelectedAction.value!.keyframes.filter(
            (id) => !deletedMap[id]
          ),
        },
      }),
      keyframeState.createClearAllAction(),
    ]
  }

  function createExecDeleteTargetKeyframeActions(
    targetId: string,
    targetFrame: number,
    key: KeyframePropKey
  ): okahistory.Action<unknown>[] {
    const keyframe = toList(visibledKeyframeMap.value).find(
      (k) => k.targetId === targetId && k.frame === targetFrame
    )
    if (!keyframe) return []

    const deletedTarget = deleteKeyframeByProp(keyframe, {
      props: { [key]: true },
    })

    return deletedTarget
      ? [
          keyframeEntities.createUpdateAction({
            [deletedTarget.id]: deletedTarget,
          }),
          keyframeState.createClearAllAction(),
        ]
      : [
          keyframeEntities.createDeleteAction([keyframe.id]),
          actionEntities.createUpdateAction({
            [lastSelectedAction.value!.id]: {
              keyframes: lastSelectedAction.value!.keyframes.filter(
                (id) => id !== keyframe.id
              ),
            },
          }),
          keyframeState.createClearAllAction(),
        ]
  }
}

export type AnimationStore = ReturnType<typeof createStore>

const { settings } = useSettings()
const store = createStore(useHistoryStore(), useStore(), {
  graphValueWidth: () => settings.graphValueWidth,
})
export function useAnimationStore() {
  return store
}
