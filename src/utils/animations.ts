import { interpolateTransform } from './armatures'
import {
  dropListByKey,
  dropMap,
  extractMap,
  mapReduce,
  mergeListByKey,
  toKeyListMap,
  toList,
} from './commons'
import {
  Action,
  Armature,
  Born,
  frameWidth,
  getTransform,
  IdMap,
  Keyframe,
  scaleRate,
  toBornIdMap,
  toMap,
  Transform,
} from '/@/models'

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

export function getFrameX(frame: number): number {
  return frame * frameWidth
}

export function getKeyframeMapByFrame(
  keyframes: Keyframe[]
): IdMap<Keyframe[]> {
  return toKeyListMap(keyframes, 'frame')
}

export function getKeyframeMapByBornId(
  keyframes: Keyframe[]
): IdMap<Keyframe[]> {
  return sortKeyframeMap(toKeyListMap(keyframes, 'bornId'))
}

export function sortKeyframes(keyframes: Keyframe[]): Keyframe[] {
  return keyframes.concat().sort((a, b) => a.frame - b.frame)
}

export function sortKeyframeMap(
  keyframeMap: IdMap<Keyframe[]>
): IdMap<Keyframe[]> {
  return mapReduce(keyframeMap, sortKeyframes)
}

export function getInterpolatedTransformMapByBornId(
  sortedKeyframes: IdMap<Keyframe[]>,
  frame: number,
  curveFn?: InterpolateCurve
): IdMap<Transform> {
  return mapReduce(
    getgetNeighborKeyframeMapByBornId(sortedKeyframes, frame),
    (neighbors) => interpolateKeyframeTransform(neighbors, frame, curveFn)
  )
}

export function getgetNeighborKeyframeMapByBornId(
  sortedKeyframes: IdMap<Keyframe[]>,
  frame: number
): IdMap<NeighborKeyframes> {
  return mapReduce(sortedKeyframes, (list) => getNeighborKeyframes(list, frame))
}

type NeighborKeyframes =
  | []
  | [same: Keyframe]
  | [before: Keyframe, after: Keyframe]

export function getNeighborKeyframes(
  sortedKeyframes: Keyframe[],
  frame: number
): NeighborKeyframes {
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
  keyframes: NeighborKeyframes,
  frame: number,
  curveFn: InterpolateCurve = (x) => x
): Transform {
  if (keyframes.length === 0) return getTransform()
  if (keyframes.length === 1) return keyframes[0]!.transform

  const a = keyframes[0]!
  const b = keyframes[1]!
  const rate = curveFn((frame - a.frame) / (b.frame - a.frame))
  return interpolateTransform(a.transform, b.transform, rate)
}

export function slideKeyframesTo(
  keyframes: Keyframe[],
  at: number
): Keyframe[] {
  if (keyframes.length === 0) return keyframes

  const min = sortKeyframes(keyframes)[0].frame
  return keyframes.map((k) => ({ ...k, frame: k.frame + (at - min) }))
}

export function mergeKeyframes(
  src: Keyframe[],
  override: Keyframe[]
): Keyframe[] {
  return mergeKeyframesWithDropped(src, override).merged
}

export function mergeKeyframesWithDropped(
  src: Keyframe[],
  override: Keyframe[]
): { merged: Keyframe[]; dropped: Keyframe[] } {
  const srcMap = toMap(src)
  const overrideMap = toMap(override)

  const srcMapByFrame = getKeyframeMapByFrame(
    toList(dropMap(srcMap, overrideMap))
  )
  const overrideMapByFrame = getKeyframeMapByFrame(override)
  const overrideMapByNewFrame = dropMap(overrideMapByFrame, srcMapByFrame)

  const dropped: Keyframe[] = toList(extractMap(srcMap, overrideMap))

  const merged = toList({
    ...mapReduce(srcMapByFrame, (keyframes, frameStr: string) => {
      dropped.push(
        ...dropListByKey(
          keyframes,
          overrideMapByFrame[frameStr] ?? [],
          'bornId',
          true
        )
      )
      return mergeListByKey(
        keyframes,
        overrideMapByFrame[frameStr] ?? [],
        'bornId'
      )
    }),
    ...overrideMapByNewFrame,
  }).flat()

  return { merged, dropped }
}

export function cleanActions(
  actions: Action[],
  armatures: Armature[]
): Action[] {
  const armatureMap = toMap(armatures)
  return actions
    .filter((action) => !!armatureMap[action.armatureId])
    .map((action) => ({
      ...action,
      keyframes: cleanKeyframes(
        action.keyframes,
        armatureMap[action.armatureId].borns
      ),
    }))
}

function cleanKeyframes(keyframes: Keyframe[], borns: Born[]): Keyframe[] {
  return toList(
    extractMap(getKeyframeMapByBornId(keyframes), toMap(borns))
  ).flat()
}
