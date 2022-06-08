import { EditMovement } from '/@/composables/modes/types'
import { AppCanvasStateContext } from '/@/composables/modeStates/appCanvas/core'
import { EditStateContext } from '/@/composables/modeStates/appCanvas/editMode/core'
import { useObjectGroupState } from '/@/composables/modeStates/appCanvas/objectGroupState'
import { ObjectStateContext } from '/@/composables/modeStates/appCanvas/objectMode/core'
import { PoseStateContext } from '/@/composables/modeStates/appCanvas/poseMode/core'
import { WeightStateContext } from '/@/composables/modeStates/appCanvas/weightMode/core'
import { CanvasStateContext } from '/@/composables/modeStates/commons'
import {
  ModeStateContextBase,
  useModeStateMachine,
} from '/@/composables/modeStates/core'
import { Bone, BoneSelectedState, IdMap, toMap } from '/@/models'
import { IndexStore } from '/@/store'
import { AnimationStore } from '/@/store/animation'
import { CanvasStore } from '/@/store/canvas'
import {
  duplicateBones,
  extrudeFromParent,
  subdivideBones,
  symmetrizeBones,
} from '/@/utils/armatures'
import { mapReduce, toList } from '/@/utils/commons'
import { generateUuid } from '/@/utils/random'
import { getNotDuplicatedName } from '/@/utils/relations'

type Option = {
  indexStore: IndexStore
  canvasStore: CanvasStore
  animationStore: AnimationStore
  requestPointerLock: CanvasStateContext['requestPointerLock']
  exitPointerLock: CanvasStateContext['exitPointerLock']
  startEditMovement: CanvasStateContext['startEditMovement']
  getEditMovement: CanvasStateContext['getEditMovement']
  setEditMovement: CanvasStateContext['setEditMovement']
  panView: CanvasStateContext['panView']
  startDragging: CanvasStateContext['startDragging']
  setRectangleDragging: CanvasStateContext['setRectangleDragging']
  getDraggedRectangle: CanvasStateContext['getDraggedRectangle']
}

export function useCanvasStateMachine(options: Option) {
  const objectCtx = createObjectContext(options)
  const editCtx = createEditContext(options)
  const poseCtx = createPoseContext(options)
  const weightCtx = createWeightContext(options)

  const ctx: AppCanvasStateContext = {
    ...createBaseContext(options),
    getObjectContext: () => objectCtx,
    getEditContext: () => editCtx,
    getPoseContext: () => poseCtx,
    getWeightContext: () => weightCtx,
    toggleMode: options.canvasStore.toggleCanvasMode,
  }

  const sm = useModeStateMachine(ctx, useObjectGroupState)
  return { sm }
}

function createBaseContext(options: Option): ModeStateContextBase {
  return {
    requestPointerLock: options.requestPointerLock,
    exitPointerLock: options.exitPointerLock,
    getTimestamp: () => Date.now(),
  }
}

function createObjectContext(options: Option): ObjectStateContext {
  const { indexStore, canvasStore } = options
  return {
    ...createBaseContext(options),

    getArmatures: () => toMap(indexStore.armatures.value),
    getLastSelectedArmaturesId: () => indexStore.lastSelectedArmatureId.value,
    selectArmature: indexStore.selectArmature,
    selectAllArmatures: indexStore.selectAllArmature,
    addArmature: indexStore.addArmature,
    deleteArmatures: indexStore.deleteArmature,

    generateUuid: generateUuid,

    startEditMovement: options.startEditMovement,
    getEditMovement: () => undefined,
    setEditMovement: () => undefined,

    panView: options.panView,
    startDragging: options.startDragging,
    setRectangleDragging: () => undefined,
    getDraggedRectangle: () => undefined,

    setPopupMenuList: canvasStore.setPopupMenuList,
    setCommandExams: canvasStore.setCommandExams,
  }
}

function createEditContext(options: Option): EditStateContext {
  const { indexStore, canvasStore } = options

  let editMovement: EditMovement | undefined

  return {
    ...createBaseContext(options),

    generateUuid: generateUuid,

    startEditMovement: options.startEditMovement,
    getEditMovement: () => editMovement,
    setEditMovement: (val) => {
      editMovement = val
    },

    panView: options.panView,
    startDragging: options.startDragging,
    setRectangleDragging: () => undefined,
    getDraggedRectangle: () => undefined,

    setPopupMenuList: canvasStore.setPopupMenuList,
    setCommandExams: canvasStore.setCommandExams,

    getBones: () => indexStore.boneMap.value,
    getLastSelectedBoneId: () => indexStore.lastSelectedBoneId.value,
    getSelectedBones: () => indexStore.selectedBones.value,
    selectBone: indexStore.selectBone,
    selectBones: indexStore.selectBones,
    selectAllBones: indexStore.selectAllBones,
    addBone: indexStore.addBone,
    updateBones: indexStore.updateBones,
    deleteBones: indexStore.deleteBone,
    extrudeBones: () => {
      const bones = indexStore.boneMap.value
      const selectedBones = indexStore.selectedBones.value
      const names = Object.values(bones).map((b) => b.name)
      const shouldSkipBones: IdMap<boolean> = {}
      const extrudedBones: Bone[] = []

      Object.keys(selectedBones).forEach((id) => {
        const selectedState = selectedBones[id]
        const parent = bones[id]

        const targetBones: Bone[] = []
        if (selectedState.tail) targetBones.push(extrudeFromParent(parent))
        if (selectedState.head)
          targetBones.push(extrudeFromParent(parent, true))

        targetBones.forEach((b) => {
          // prevent to extruding from same parent
          if (!shouldSkipBones[b.parentId]) {
            b.name = getNotDuplicatedName(parent.name, names)
            extrudedBones.push(b)
            names.push(b.name)
            shouldSkipBones[b.parentId] = true
          }
        })
      })

      // grab the new bones if its are extruded
      if (extrudedBones.length > 0) {
        indexStore.addBones(extrudedBones, { tail: true })
      }
    },
    dissolveBones: indexStore.dissolveBone,
    subdivideBones: () => {
      const upsertedBones = subdivideBones(
        indexStore.boneMap.value,
        Object.keys(indexStore.allSelectedBones.value)
      )
      // select subdivided bones
      const subdividedIdMap = Object.keys(upsertedBones).reduce<
        IdMap<BoneSelectedState>
      >((p, id) => {
        if (!indexStore.boneMap.value[id]) {
          p[id] = { head: true, tail: true }
          // subdivided new bone must have a parent
          p[upsertedBones[id].parentId] = { head: true, tail: true }
        }
        return p
      }, {})

      indexStore.upsertBones(toList(upsertedBones), subdividedIdMap)
    },
    symmetrizeBones: () => {
      const created = symmetrizeBones(
        indexStore.boneMap.value,
        indexStore.constraintMap.value,
        Object.keys(indexStore.allSelectedBones.value)
      )
      indexStore.upsertBones(
        created.bones,
        mapReduce(toMap(created.bones), () => ({ head: true, tail: true })),
        created.createdConstraints
      )
    },
    duplicateBones: () => {
      const srcBones = indexStore.allSelectedBones.value
      const names = toList(indexStore.boneMap.value).map((a) => a.name) ?? []
      const duplicated = duplicateBones(
        srcBones,
        indexStore.constraintMap.value,
        names
      )
      indexStore.addBones(
        duplicated.bones,
        { head: true, tail: true },
        duplicated.createdConstraints
      )
    },

    setEditTransform: canvasStore.setEditTransform,
    completeEditTransform: canvasStore.completeEditTransform,
    setAxisGridInfo: canvasStore.setAxisGridInfo,
    getAxisGridInfo: () => canvasStore.axisGridLine.value,
    snapTranslate: canvasStore.snapTranslate,
    snapScaleDiff: canvasStore.snapScaleDiff,

    setToolMenuGroups: canvasStore.setToolMenuGroups,
  }
}

function createPoseContext(options: Option): PoseStateContext {
  const { indexStore, canvasStore, animationStore } = options

  let editMovement: EditMovement | undefined

  return {
    ...createBaseContext(options),

    generateUuid: generateUuid,

    startEditMovement: options.startEditMovement,
    getEditMovement: () => editMovement,
    setEditMovement: (val) => {
      editMovement = val
    },

    panView: options.panView,
    startDragging: options.startDragging,
    setRectangleDragging: () => undefined,
    getDraggedRectangle: () => undefined,

    setPopupMenuList: canvasStore.setPopupMenuList,
    setCommandExams: canvasStore.setCommandExams,

    getBones: () => animationStore.currentPosedBones.value,
    getLastSelectedBoneId: () => indexStore.lastSelectedBoneId.value,
    getSelectedBones: () => animationStore.selectedBones.value,
    selectBone: indexStore.selectBone,
    selectBones: indexStore.selectBones,
    selectAllBones: indexStore.selectAllBones,

    setEditTransforms: canvasStore.setPoseTransforms,
    completeEditTransforms: canvasStore.completePoseTransforms,
    setAxisGridInfo: canvasStore.setAxisGridInfo,
    getAxisGridInfo: () => canvasStore.axisGridLine.value,
    snapTranslate: canvasStore.snapTranslate,
    snapScaleDiff: canvasStore.snapScaleDiff,
    insertKeyframe: animationStore.execInsertKeyframe,

    setToolMenuGroups: canvasStore.setToolMenuGroups,
  }
}

function createWeightContext(options: Option): WeightStateContext {
  const { canvasStore } = options

  let editMovement: EditMovement | undefined

  return {
    ...createBaseContext(options),

    generateUuid: generateUuid,

    startEditMovement: options.startEditMovement,
    getEditMovement: () => editMovement,
    setEditMovement: (val) => {
      editMovement = val
    },

    panView: options.panView,
    startDragging: options.startDragging,
    setRectangleDragging: () => undefined,
    getDraggedRectangle: () => undefined,

    setPopupMenuList: canvasStore.setPopupMenuList,
    setCommandExams: canvasStore.setCommandExams,
  }
}
