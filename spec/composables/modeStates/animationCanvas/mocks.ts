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

function getMockCommonCtx() {
  return {
    startDragging: jest.fn(),
    setRectangleDragging: jest.fn(),
    getDraggedRectangle: jest.fn(),
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
    selectKeyframes: jest.fn(),
    selectAllKeyframes: jest.fn(),
    deleteKeyframes: jest.fn(),
    updateKeyframes: jest.fn(),
    pasteKeyframes: jest.fn(),
    setCurrentFrame: jest.fn(),
    setTmpKeyframes: jest.fn(),
  } as any
}

export function getMockActionCtx() {
  return getMockCommonCtx()
}

export function getMockGraphCtx() {
  return {
    ...getMockCommonCtx(),
    toCurveControl: jest.fn(),
    toFrameValue: jest.fn(),
  }
}

export function getMockLabelCtx() {
  return getMockCommonCtx()
}
