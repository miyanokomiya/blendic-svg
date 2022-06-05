import { AppCanvasStateContext } from '/@/composables/modeStates/appCanvas/core'
import { EditStateContext } from '/@/composables/modeStates/appCanvas/editMode/core'
import { useObjectGroupState } from '/@/composables/modeStates/appCanvas/objectGroupState'
import { ObjectStateContext } from '/@/composables/modeStates/appCanvas/objectMode/core'
import { CanvasStateContext } from '/@/composables/modeStates/commons'
import {
  ModeStateContextBase,
  useModeStateMachine,
} from '/@/composables/modeStates/core'
import { toMap } from '/@/models'
import { IndexStore } from '/@/store'
import { CanvasStore } from '/@/store/canvas'
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
  // const { indexStore } = options
  return {
    ...createBaseContext(options),

    // getArmatures: () => toMap(indexStore.armatures.value),
    // getLastSelectedArmaturesId: () => indexStore.lastSelectedArmatureId.value,
    // selectArmature: indexStore.selectArmature,
    // selectAllArmatures: indexStore.selectAllArmature,
    // addArmature: indexStore.addArmature,
    // deleteArmatures: indexStore.deleteArmature,

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
