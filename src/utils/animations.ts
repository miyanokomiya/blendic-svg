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

import {
  dropListByKey,
  dropMap,
  extractMap,
  mapReduce,
  mergeListByKey,
  toKeyListMap,
  toKeyMap,
  toList,
} from './commons'
import {
  Action,
  Armature,
  Bone,
  frameWidth,
  getTransform,
  IdMap,
  scaleRate,
  toMap,
  Transform,
} from '/@/models'
import {
  KeyframeBase,
  KeyframeBone,
  KeyframeBoneProps,
  KeyframePoint,
} from '/@/models/keyframe'
import { isSameTransform } from '/@/utils/geometry'
import {
  getKeyframeBoneDefaultPropsMap,
  getKeyframeBonePropsMap,
  mergeKeyframeBones,
} from '/@/utils/keyframes'
import { isSameKeyframePoint } from '/@/utils/keyframes/core'

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

export function getKeyframeMapByFrame<T extends KeyframeBase>(
  keyframes: T[]
): IdMap<T[]> {
  return toKeyListMap(keyframes, 'frame')
}

export function getKeyframeMapByBoneId(
  keyframes: KeyframeBone[]
): IdMap<KeyframeBone[]> {
  return sortKeyframeMap(toKeyListMap(keyframes, 'boneId'))
}

export function sortKeyframes<T extends KeyframeBase>(keyframes: T[]): T[] {
  return keyframes.concat().sort((a, b) => a.frame - b.frame)
}

export function sortKeyframeMap(
  keyframeMap: IdMap<KeyframeBone[]>
): IdMap<KeyframeBone[]> {
  return mapReduce(keyframeMap, sortKeyframes)
}

export function getAfterKeyframe(
  sortedKeyframes: KeyframeBone[],
  frame: number
): KeyframeBone | undefined {
  if (sortedKeyframes.length === 0) return
  const afterIndex = sortedKeyframes.findIndex((k) => frame < k.frame)
  if (afterIndex === -1) return
  return sortedKeyframes[afterIndex]
}

export function isSameKeyframeStatus(
  a: KeyframeBone,
  b: KeyframeBone
): boolean {
  return isSameTransform(keyframeBoneToTransform(a), keyframeBoneToTransform(b))
}

function keyframeBoneToTransform(k: KeyframeBone): Transform {
  return getTransform({
    translate: { x: k.translateX?.value ?? 0, y: k.translateY?.value ?? 0 },
    rotate: k.rotate?.value ?? 0,
    scale: { x: k.scaleX?.value ?? 1, y: k.scaleY?.value ?? 1 },
  })
}

export function slideKeyframesTo<T extends KeyframeBase>(
  keyframes: T[],
  at: number
): T[] {
  if (keyframes.length === 0) return keyframes

  const min = sortKeyframes(keyframes)[0].frame
  return keyframes.map((k) => ({ ...k, frame: k.frame + (at - min) }))
}

export function mergeKeyframes(
  src: KeyframeBone[],
  override: KeyframeBone[],
  mergeDeep = false
): KeyframeBone[] {
  return mergeKeyframesWithDropped(src, override, mergeDeep).merged
}

export function mergeKeyframesWithDropped(
  src: KeyframeBone[],
  override: KeyframeBone[],
  mergeDeep = false
): { merged: KeyframeBone[]; dropped: KeyframeBone[] } {
  const srcMap = toMap(src)
  const overrideMap = toMap(override)

  const srcMapByFrame = getKeyframeMapByFrame(
    toList(dropMap(srcMap, overrideMap))
  )
  const overrideMapByFrame = getKeyframeMapByFrame(override)
  const overrideMapByNewFrame = dropMap(overrideMapByFrame, srcMapByFrame)

  const droppedMap: IdMap<KeyframeBone> = extractMap(srcMap, overrideMap)
  const dropped: KeyframeBone[] = toList(droppedMap)

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
      const srcMapByBoneId = toKeyMap(keyframes, 'boneId')
      const oveMapByBoneId = toKeyMap(
        overrideMapByFrame[frameStr] ?? [],
        'boneId'
      )

      if (mergeDeep) {
        return Object.keys({
          ...srcMapByBoneId,
          ...oveMapByBoneId,
        }).reduce<KeyframeBone[]>((p, boneId) => {
          if (!oveMapByBoneId[boneId]) {
            p.push(srcMapByBoneId[boneId])
          } else if (!srcMapByBoneId[boneId]) {
            p.push(oveMapByBoneId[boneId])
          } else {
            const merged = mergeKeyframeBones(
              srcMapByBoneId[boneId],
              oveMapByBoneId[boneId]
            )
            p.push(merged)
          }

          return p
        }, [])
      } else {
        return mergeListByKey(
          keyframes,
          overrideMapByFrame[frameStr] ?? [],
          'boneId'
        )
      }
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

function cleanKeyframes(
  keyframes: KeyframeBone[],
  bones: Bone[]
): KeyframeBone[] {
  return toList(
    extractMap(getKeyframeMapByBoneId(keyframes), toMap(bones))
  ).flat()
}

export function findNextFrameWithKeyframe<T extends KeyframeBase>(
  keyframes: T[],
  currentFrame: number
): number {
  const gt = Object.keys(getKeyframeMapByFrame(keyframes))
    .map((s) => parseInt(s))
    .filter((frame) => currentFrame < frame)
  return gt.length > 0 ? gt[0] : currentFrame
}

export function findPrevFrameWithKeyframe(
  keyframes: KeyframeBone[],
  currentFrame: number
): number {
  const gt = Object.keys(getKeyframeMapByFrame(keyframes))
    .map((s) => parseInt(s))
    .filter((frame) => frame < currentFrame)
  return gt.length > 0 ? gt[gt.length - 1] : currentFrame
}

export interface KeyframeBoneSameRange
  extends Required<KeyframeBoneProps<number>> {
  all: number
}

export function getSamePropRangeFrameMapByBoneId(
  keyframeMapByBoneId: IdMap<KeyframeBone[]>
): IdMap<IdMap<KeyframeBoneSameRange>> {
  return Object.keys(keyframeMapByBoneId).reduce<
    IdMap<IdMap<KeyframeBoneSameRange>>
  >((p, boneId) => {
    p[boneId] = keyframeMapByBoneId[boneId].reduce<
      IdMap<KeyframeBoneSameRange>
    >((p, k, i) => {
      p[k.frame] = getSamePropRangeFrameMap(keyframeMapByBoneId[boneId], i)
      return p
    }, {})
    return p
  }, {})
}

export function getSamePropRangeFrameMap(
  keyframes: KeyframeBone[],
  currentIndex: number
): KeyframeBoneSameRange {
  const keyframesFromCurrent = keyframes.slice(currentIndex)
  const current = keyframesFromCurrent[0]
  if (keyframesFromCurrent.length < 2)
    return { ...getKeyframeBoneDefaultPropsMap(() => 0), all: 0 }

  const propMap = getKeyframeBonePropsMap(keyframesFromCurrent)
  const translateX = current.translateX
    ? getSamePropRangeFrame(propMap.translateX, (k) => k.translateX)
    : 0
  const translateY = current.translateY
    ? getSamePropRangeFrame(propMap.translateY, (k) => k.translateY)
    : 0
  const rotate = current.rotate
    ? getSamePropRangeFrame(propMap.rotate, (k) => k.rotate)
    : 0
  const scaleX = current.scaleX
    ? getSamePropRangeFrame(propMap.scaleX, (k) => k.scaleX)
    : 0
  const scaleY = current.scaleY
    ? getSamePropRangeFrame(propMap.scaleY, (k) => k.scaleY)
    : 0

  return {
    all: [translateY, rotate, scaleX, scaleY].reduce(
      (p, c) => Math.min(p, c),
      translateX
    ),
    translateX,
    translateY,
    rotate,
    scaleX,
    scaleY,
  }
}

function getSamePropRangeFrame(
  keyframes: KeyframeBone[],
  getValue: (k: KeyframeBone) => KeyframePoint | undefined
): number {
  if (keyframes.length < 2) return 0

  const current = keyframes[0]
  const after = keyframes[1]
  const currentValue = getValue(current)
  const afterValue = getValue(after)
  if (
    currentValue &&
    afterValue &&
    isSameKeyframePoint(currentValue, afterValue)
  ) {
    return after.frame - current.frame
  } else {
    return 0
  }
}

export function getLastFrame<T extends KeyframeBase>(keyframes: T[]): number {
  return keyframes.reduce((p, c) => {
    return Math.max(p, c.frame)
  }, 0)
}
