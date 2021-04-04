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

import { useThrottle } from '/@/composables/throttle'

async function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

describe('src/composables/throttle.ts', () => {
  describe('useThrottle', () => {
    it('omit internal calling', async () => {
      const fn = jest.fn()
      const t = useThrottle(fn, 10)
      t()
      t()
      t()
      await sleep(20)

      expect(fn).toHaveBeenCalledTimes(1)
    })
    it('recall after waiting the interval', async () => {
      const fn = jest.fn()
      const t = useThrottle(fn, 10)
      t()
      await sleep(20)
      t()
      await sleep(20)

      expect(fn).toHaveBeenCalledTimes(2)
    })
    it('pass args', async () => {
      const mock = jest.fn()
      const fn = (val1: number, val2: number) => mock(val1, val2)
      const t = useThrottle(fn, 10)
      t(10, 100)
      await sleep(5)
      t(20, 200)
      await sleep(20)
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock).toHaveBeenCalledWith(20, 200)
    })
    describe('if option.leading is true', () => {
      fit('call leading', async () => {
        const mock = jest.fn()
        const fn = (val1: number, val2: number) => mock(val1, val2)
        const t = useThrottle(fn, 10, true)
        t(10, 100)
        await sleep(20)
        t(20, 200)
        await sleep(5)
        t(30, 300)
        await sleep(20)

        expect(mock).toHaveBeenCalledTimes(2)
        expect(mock).toHaveBeenNthCalledWith(1, 10, 100)
        expect(mock).toHaveBeenNthCalledWith(2, 20, 200)
      })
    })
  })
})
