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
