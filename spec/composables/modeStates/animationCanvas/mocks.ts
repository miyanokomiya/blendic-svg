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

export function getMockActionCtx() {
  return {
    startDragging: jest.fn(),
    requestPointerLock: jest.fn(),
    exitPointerLock: jest.fn(),
    setCommandExams: jest.fn(),
    setViewport: jest.fn(),
    startEditMovement: jest.fn(),
    getCursorPoint: jest.fn(),
    getEditMovement: jest.fn(),
    setEditMovement: jest.fn(),
    completeEdit: jest.fn(),

    setPopupMenuList: jest.fn(),
    generateSeriesKey: jest.fn().mockReturnValue('mock-key'),
    getKeyframes: jest.fn().mockReturnValue({}),
    getLastSelectedKeyframeId: jest.fn().mockReturnValue(''),
    getSelectedKeyframes: jest.fn().mockReturnValue({}),
    selectKeyframe: jest.fn(),
    selectAllKeyframes: jest.fn(),
    deleteKeyframes: jest.fn(),
    updateKeyframes: jest.fn(),
    setCurrentFrame: jest.fn(),
    setTmpKeyframes: jest.fn(),
  } as any
}

export function getMockGraphCtx() {
  return {
    startDragging: jest.fn(),
    requestPointerLock: jest.fn(),
    exitPointerLock: jest.fn(),
    setCommandExams: jest.fn(),
    setViewport: jest.fn(),
    startEditMovement: jest.fn(),
    getCursorPoint: jest.fn(),
    getEditMovement: jest.fn(),
    setEditMovement: jest.fn(),
    completeEdit: jest.fn(),

    setPopupMenuList: jest.fn(),
    generateSeriesKey: jest.fn().mockReturnValue('mock-key'),
    getKeyframes: jest.fn().mockReturnValue({}),
    getLastSelectedKeyframeId: jest.fn().mockReturnValue(''),
    getSelectedKeyframes: jest.fn().mockReturnValue({}),
    selectKeyframe: jest.fn(),
    selectAllKeyframes: jest.fn(),
    deleteKeyframes: jest.fn(),
    updateKeyframes: jest.fn(),
    setCurrentFrame: jest.fn(),
    setTmpKeyframes: jest.fn(),
  } as any
}
