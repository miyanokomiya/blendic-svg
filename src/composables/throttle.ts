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

// if you want to avoid calling async, set leading true
// e.g. e.currentTarget is lost in async calling
export function useThrottle<T extends (...args: any[]) => void>(
  fn: T,
  interval: number,
  leading = false
) {
  let wait = false
  let currentArgs: Parameters<T>

  function throttle(...args: Parameters<T>) {
    currentArgs = args
    if (wait) return

    wait = true

    if (leading) {
      fn(...currentArgs)
    }

    setTimeout(() => {
      if (!leading) {
        fn(...currentArgs)
      }
      wait = false
    }, interval)
  }

  return throttle
}
