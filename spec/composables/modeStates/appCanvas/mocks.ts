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

Copyright (C) 2022, Tomoya Komiyama.
*/

export function getMockObjectCtx() {
  return {
    requestPointerLock: jest.fn(),
    exitPointerLock: jest.fn(),
    selectArmature: jest.fn(),
    setCommandExams: jest.fn(),
    pickBone: jest.fn(),
    startPickBone: jest.fn(),
    setViewport: jest.fn(),

    addArmature: jest.fn(),
    getArmatures: jest.fn().mockReturnValue({}),
    selectAllArmatures: jest.fn(),
    getLastSelectedArmaturesId: jest.fn(),
    deleteArmatures: jest.fn(),
  } as any
}

export function getMockEditCtx() {
  return {
    requestPointerLock: jest.fn(),
    exitPointerLock: jest.fn(),
    setCommandExams: jest.fn(),
    setPopupMenuList: jest.fn(),
    startDragging: jest.fn(),
    setRectangleDragging: jest.fn(),
    getDraggedRectangle: jest.fn(),
    pickBone: jest.fn(),
    startPickBone: jest.fn(),
    setViewport: jest.fn(),

    setToolMenuGroups: jest.fn(),
    selectBone: jest.fn(),
    selectBones: jest.fn(),
    addBone: jest.fn(),
    selectAllBones: jest.fn(),
    getBones: jest.fn().mockReturnValue({}),
    getSelectedBones: jest.fn().mockReturnValue({}),
    getLastSelectedBoneId: jest.fn(),

    extrudeBones: jest.fn(),
    duplicateBones: jest.fn(),
    getDuplicateBones: jest.fn(),
    deleteBones: jest.fn(),
    dissolveBones: jest.fn(),
    subdivideBones: jest.fn(),
    symmetrizeBones: jest.fn(),
    setEditTransform: jest.fn(),
    completeEditTransform: jest.fn(),
    setAxisGridInfo: jest.fn(),
    getAxisGridInfo: jest.fn(),
  } as any
}

export function getMockPoseCtx() {
  return {
    requestPointerLock: jest.fn(),
    exitPointerLock: jest.fn(),
    setCommandExams: jest.fn(),
    setPopupMenuList: jest.fn(),
    startDragging: jest.fn(),
    setRectangleDragging: jest.fn(),
    getDraggedRectangle: jest.fn(),
    pickBone: jest.fn(),
    startPickBone: jest.fn(),
    setViewport: jest.fn(),

    setToolMenuGroups: jest.fn(),
    selectBone: jest.fn(),
    selectBones: jest.fn(),
    selectAllBones: jest.fn(),
    getBones: jest.fn().mockReturnValue({}),
    getSelectedBones: jest.fn().mockReturnValue({}),
    getLastSelectedBoneId: jest.fn(),

    setEditTransforms: jest.fn(),
    completeEditTransforms: jest.fn(),
    setAxisGridInfo: jest.fn(),
    getAxisGridInfo: jest.fn(),
    insertKeyframe: jest.fn(),
    pastePoses: jest.fn(),
  } as any
}

export function getMockWeightCtx() {
  return {
    requestPointerLock: jest.fn(),
    exitPointerLock: jest.fn(),
    setCommandExams: jest.fn(),
    setPopupMenuList: jest.fn(),
    pickBone: jest.fn(),
    startPickBone: jest.fn(),
    setViewport: jest.fn(),

    selectElement: jest.fn(),
  } as any
}
