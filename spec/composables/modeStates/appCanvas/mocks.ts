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
    addArmature: jest.fn(),
    selectAllArmatures: jest.fn(),
    deleteArmatures: jest.fn(),
  } as any
}

export function getMockEditCtx() {
  return {
    requestPointerLock: jest.fn(),
    exitPointerLock: jest.fn(),
    setCommandExams: jest.fn(),
    startEditMovement: jest.fn(),
    setEditMovement: jest.fn(),
    setPopupMenuList: jest.fn(),

    setToolMenuGroups: jest.fn(),
    selectBone: jest.fn(),
    addBone: jest.fn(),
    selectAllBones: jest.fn(),
    getBones: jest.fn().mockReturnValue({}),
    getSelectedBones: jest.fn().mockReturnValue({}),
    getLastSelectedBoneId: jest.fn(),

    extrudeBones: jest.fn(),
    duplicateBones: jest.fn(),
    deleteBones: jest.fn(),
    dissolveBones: jest.fn(),
    subdivideBones: jest.fn(),
    symmetrizeBones: jest.fn(),
    snapTranslate: jest.fn().mockReturnValue({ x: 100, y: 200 }),
    snapScaleDiff: jest.fn().mockReturnValue({ x: 0.1, y: 0.2 }),
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
    startEditMovement: jest.fn(),
    setEditMovement: jest.fn(),
    setPopupMenuList: jest.fn(),

    setToolMenuGroups: jest.fn(),
    selectBone: jest.fn(),
    selectAllBones: jest.fn(),
    getBones: jest.fn().mockReturnValue({}),
    getSelectedBones: jest.fn().mockReturnValue({}),
    getLastSelectedBoneId: jest.fn(),

    snapTranslate: jest.fn().mockReturnValue({ x: 100, y: 200 }),
    snapScaleDiff: jest.fn().mockReturnValue({ x: 0.1, y: 0.2 }),
    setEditTransforms: jest.fn(),
    completeEditTransforms: jest.fn(),
    setAxisGridInfo: jest.fn(),
    getAxisGridInfo: jest.fn(),
    insertKeyframe: jest.fn(),
  } as any
}
