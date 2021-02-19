import { interpolateTransform } from './armatures'
import { mapReduce } from './commons'
import { getTransform, IdMap, Keyframe, Transform } from '/@/models'

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

export function sortKeyframes(keyframes: Keyframe[]): Keyframe[] {
  return keyframes.concat().sort((a, b) => a.frame - b.frame)
}

export function sortKeyframeMap(
  keyframeMap: IdMap<Keyframe[]>
): IdMap<Keyframe[]> {
  return mapReduce(keyframeMap, sortKeyframes)
}

export function getNeighborKeyframes(
  sortedKeyframes: Keyframe[],
  frame: number
): [before?: Keyframe, after?: Keyframe] {
  if (sortedKeyframes.length === 0) return []
  const afterIndex = sortedKeyframes.findIndex((k) => frame <= k.frame)
  if (afterIndex === -1) return [sortedKeyframes[sortedKeyframes.length - 1]]
  const after = sortedKeyframes[afterIndex]
  if (after.frame === frame || afterIndex === 0) return [after]
  const before = sortedKeyframes[afterIndex - 1]
  if (before.frame === frame) return [before]
  return [before, after]
}

type InterpolateCurve = (val: number) => number

export function interpolateKeyframeTransform(
  keyframes: [before?: Keyframe, after?: Keyframe],
  frame: number,
  interpolateFn: InterpolateCurve = (x) => x
): Transform {
  if (keyframes.length === 0) return getTransform()
  if (keyframes.length === 1) return keyframes[0]!.transform

  const a = keyframes[0]!
  const b = keyframes[1]!
  const rate = interpolateFn((frame - a.frame) / (b.frame - a.frame))
  return interpolateTransform(a.transform, b.transform, rate)
}
