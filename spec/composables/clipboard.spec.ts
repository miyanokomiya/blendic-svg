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

import { useClipboardSerializer } from '/@/composables/clipboard'

describe('src/composables/clipboard.ts', () => {
  describe('useClipboardSerializer', () => {
    describe('serialize', () => {
      it('should serialize the data', () => {
        const serializer = useClipboardSerializer('test')
        expect(JSON.parse(serializer.serialize({ a: 1 }))).toEqual({
          app: 'blendic-svg',
          appVersion: expect.anything(),
          type: 'test',
          data: { a: 1 },
        })
      })
    })

    describe('deserialize', () => {
      it('should deserialize the data', () => {
        const serializer = useClipboardSerializer('test')
        expect(
          serializer.deserialize(
            JSON.stringify({
              app: 'blendic-svg',
              appVersion: process.env.APP_VERSION,
              type: 'test',
              data: { a: 1 },
            })
          )
        ).toEqual({ a: 1 })
      })
      it('should throw if the data has invalid format', () => {
        const serializer = useClipboardSerializer('test')
        const obj = {
          app: 'blendic-svg',
          appVersion: process.env.APP_VERSION,
          type: 'test',
          data: { a: 1 },
        }
        expect(() =>
          serializer.deserialize(JSON.stringify({ ...obj, app: 'blendic' }))
        ).toThrowError()
        expect(() =>
          serializer.deserialize(JSON.stringify({ ...obj, type: 'unknown' }))
        ).toThrowError()
      })
    })
  })
})
