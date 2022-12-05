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

export function getMockCtx() {
  return {
    getTimestamp: jest.fn().mockReturnValue(0),
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
    setToolMenuList: jest.fn(),
    generateSeriesKey: jest.fn().mockReturnValue('mock-key'),

    getLastSelectedNodeId: jest.fn(),
    getSelectedNodeMap: jest.fn().mockReturnValue({}),
    updateNodes: jest.fn(),
  } as any
}
