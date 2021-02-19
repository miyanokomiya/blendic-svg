import { IdMap, Keyframe } from '/@/models'

const scaleRate = 1.1
export const frameWidth = 20

export function getScaleLog(scale: number): number {
  return Math.round(Math.log(scale) / Math.log(scaleRate))
}

export function getFrameInterval(scale: number): number {
  return Math.round(getScaleLog(scale) / 2) + 1
}

export function visibledFrameStart(frameInterval: number, originX: number) {
  const frame = Math.floor(Math.max(originX, 0) / frameWidth)
  return frame - (frame % (frameInterval * 2))
}

export function getNearestFrameAtPoint(x: number): number {
  return Math.round(Math.max(x, 0) / frameWidth)
}

export function getKeyframesAt(
  keyframes: Keyframe[],
  frame: number
): Keyframe[] {
  return keyframes.filter((k) => k.frame === frame)
}

export function getKeyframeMapByFrame(
  keyframes: Keyframe[]
): IdMap<Keyframe[]> {
  const map: IdMap<Keyframe[]> = {}
  keyframes.forEach((kf) => {
    if (map[kf.frame]) {
      map[kf.frame].push(kf)
    } else {
      map[kf.frame] = [kf]
    }
  })
  return map
}

export function getKeyframeMapByBornId(
  keyframes: Keyframe[]
): IdMap<Keyframe[]> {
  const map: IdMap<Keyframe[]> = {}
  keyframes.forEach((kf) => {
    if (map[kf.frame]) {
      map[kf.bornId].push(kf)
    } else {
      map[kf.bornId] = [kf]
    }
  })
  return map
}
