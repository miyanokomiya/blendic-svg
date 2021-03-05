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
  Bone,
  frameWidth,
  getTransform,
  IdMap,
  Keyframe,
  scaleRate,
  toMap,
  Transform,
} from '/@/models'
import { isSameTransform } from '/@/utils/geometry'

export function getScaleLog(scale: number): number {
  return Math.round(Math.log(scale) / Math.log(scaleRate))
}

export function getFrameInterval(scale: number): number {
  const level = Math.round(getScaleLog(scale) / 2) + 1
  return Math.round(level / 5) * 5 + 5
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

export function getKeyframeMapByBoneId(
  keyframes: Keyframe[]
): IdMap<Keyframe[]> {
  return sortKeyframeMap(toKeyListMap(keyframes, 'boneId'))
}

export function sortKeyframes(keyframes: Keyframe[]): Keyframe[] {
  return keyframes.concat().sort((a, b) => a.frame - b.frame)
}

export function sortKeyframeMap(
  keyframeMap: IdMap<Keyframe[]>
): IdMap<Keyframe[]> {
  return mapReduce(keyframeMap, sortKeyframes)
}

export function getInterpolatedTransformMapByBoneId(
  sortedKeyframes: IdMap<Keyframe[]>,
  frame: number,
  curveFn?: InterpolateCurve
): IdMap<Transform> {
  return mapReduce(
    getgetNeighborKeyframeMapByBoneId(sortedKeyframes, frame),
    (neighbors) => interpolateKeyframeTransform(neighbors, frame, curveFn)
  )
}

export function getgetNeighborKeyframeMapByBoneId(
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

export function getAfterKeyframe(
  sortedKeyframes: Keyframe[],
  frame: number
): Keyframe | undefined {
  if (sortedKeyframes.length === 0) return
  const afterIndex = sortedKeyframes.findIndex((k) => frame < k.frame)
  if (afterIndex === -1) return
  return sortedKeyframes[afterIndex]
}

export function isSameKeyframeStatus(a: Keyframe, b: Keyframe): boolean {
  return isSameTransform(a.transform, b.transform)
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
          'boneId',
          true
        )
      )
      return mergeListByKey(
        keyframes,
        overrideMapByFrame[frameStr] ?? [],
        'boneId'
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
        armatureMap[action.armatureId].bones
      ),
    }))
}

function cleanKeyframes(keyframes: Keyframe[], bones: Bone[]): Keyframe[] {
  return toList(
    extractMap(getKeyframeMapByBoneId(keyframes), toMap(bones))
  ).flat()
}

export function findNextFrameWithKeyframe(
  keyframes: Keyframe[],
  currentFrame: number
): number {
  const gt = Object.keys(getKeyframeMapByFrame(keyframes))
    .map((s) => parseInt(s))
    .filter((frame) => currentFrame < frame)
  return gt.length > 0 ? gt[0] : currentFrame
}

export function findPrevFrameWithKeyframe(
  keyframes: Keyframe[],
  currentFrame: number
): number {
  const gt = Object.keys(getKeyframeMapByFrame(keyframes))
    .map((s) => parseInt(s))
    .filter((frame) => frame < currentFrame)
  return gt.length > 0 ? gt[gt.length - 1] : currentFrame
}
