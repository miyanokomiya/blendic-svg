import { EditMovement } from '/@/composables/modes/types'
import { AppCanvasStateContext } from '/@/composables/modeStates/appCanvas/core'
import { EditStateContext } from '/@/composables/modeStates/appCanvas/editMode/core'
import { useObjectGroupState } from '/@/composables/modeStates/appCanvas/objectGroupState'
import { ObjectStateContext } from '/@/composables/modeStates/appCanvas/objectMode/core'
import { CanvasStateContext } from '/@/composables/modeStates/commons'
import {
  ModeStateContextBase,
  useModeStateMachine,
} from '/@/composables/modeStates/core'
import { BoneSelectedState, IdMap, toMap } from '/@/models'
import { IndexStore } from '/@/store'
import { CanvasStore } from '/@/store/canvas'
import {
  duplicateBones,
  subdivideBones,
  symmetrizeBones,
} from '/@/utils/armatures'
import { mapReduce, toList } from '/@/utils/commons'
import { generateUuid } from '/@/utils/random'

type Option = {
  indexStore: IndexStore
  canvasStore: CanvasStore
} & Exclude<CanvasStateContext, 'generateUuid'>

export function useCanvasStateMachine(options: Option) {
  const objectCtx = createObjectContext(options)
  const editCtx = createEditContext(options)

  const ctx: AppCanvasStateContext = {
    ...createBaseContext(options),
    getObjectContext: () => objectCtx,
    getEditContext: () => editCtx,
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
  const { indexStore } = options
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

    setPopupMenuList: options.setPopupMenuList,
    setCommandExams: options.setCommandExams,
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

    setPopupMenuList: options.setPopupMenuList,
    setCommandExams: options.setCommandExams,

    getBones: () => indexStore.boneMap.value,
    getLastSelectedBoneId: () => indexStore.lastSelectedBoneId.value,
    getSelectedBones: () => indexStore.selectedBones.value,
    selectBone: indexStore.selectBone,
    selectBones: indexStore.selectBones,
    selectAllBones: indexStore.selectAllBones,
    addBone: indexStore.addBone,
    updateBones: indexStore.updateBones,
    deleteBones: indexStore.deleteBone,
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
  }
}
