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

function getTime() {
  return performance?.now?.() ?? Date.now()
}

export function useAnimationLoop(
  callback: (tickFrame: number) => void,
  framerate = 60
) {
  let startTime = 0
  let lastFrame = 0
  let stopped = false

  function tick() {
    if (stopped) return

    const currentFrame = Math.floor(
      (getTime() - startTime) / (1000 / framerate)
    )
    const tickFrame = currentFrame - lastFrame
    if (tickFrame > 0) {
      callback(tickFrame)
      lastFrame = currentFrame
    }
    requestAnimationFrame(tick)
  }

  return {
    begin() {
      startTime = getTime()
      requestAnimationFrame(tick)
    },
    stop() {
      stopped = true
    },
  }
}
