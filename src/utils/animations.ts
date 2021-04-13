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

import { IVec2 } from 'okageo'
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
  IdMap,
  scaleRate,
  toMap,
  Transform,
} from '/@/models'
import { KeyframeBase, KeyframeBone } from '/@/models/keyframe'
import { invertPoseTransform, multiPoseTransform } from '/@/utils/armatures'
import { circleClamp } from '/@/utils/geometry'
import { mergeKeyframe } from '/@/utils/keyframes'

export function getScaleLog(scale: number): number {
  return Math.round(Math.log(scale) / Math.log(scaleRate))
}

export function getFrameInterval(scale: number): number {
  const level = Math.round(getScaleLog(scale) / 2) + 1
  return Math.round(level / 5) * 5 + 5
}
export function getValueInterval(valueWidth: number, scale: number): number {
  const level = Math.round(getScaleLog(scale) / 2) + 1
  return (Math.round(level / 3) + 1) * getValueIntervalUnit(valueWidth)
}
function getValueIntervalUnit(valueWidth: number): number {
  if (valueWidth > 7) return 5
  if (valueWidth > 5) return 10
  if (valueWidth > 3) return 15
  if (valueWidth > 2) return 20
  if (valueWidth > 1.5) return 25
  if (valueWidth > 1.0) return 50
  return 100
}

export function canvasToNearestFrame(x: number): number {
  return Math.round(canvasToFrame(x))
}

export function canvasToFrame(x: number): number {
  return x / frameWidth
}

export function frameToCanvas(frame: number): number {
  return frame * frameWidth
}

export function canvasToValue(value: number, valueWidth: number): number {
  return value / valueWidth
}

/**
 * @param p point in canvas space
 * @return x: frame, y: value
 */
export function canvasToFrameValue(p: IVec2, valueWidth: number): IVec2 {
  return {
    x: canvasToNearestFrame(p.x),
    y: canvasToValue(p.y, valueWidth),
  }
}

export function visibledFrameStart(frameInterval: number, originX: number) {
  const frame = Math.floor(Math.max(originX, 0) / frameWidth)
  return frame - (frame % (frameInterval * 2))
}
export function visibledValueStart(
  valueWidth: number,
  valueInterval: number,
  originY: number
) {
  const frame = Math.floor(originY / valueWidth)
  return frame - (frame % valueInterval) - (frame > 0 ? 0 : valueInterval)
}

export function getKeyframeMapByFrame<T extends KeyframeBase>(
  keyframes: T[]
): IdMap<T[]> {
  return toKeyListMap(keyframes, 'frame')
}

export function getKeyframeMapByTargetId(
  keyframes: KeyframeBone[]
): IdMap<KeyframeBone[]> {
  return sortKeyframeMap(toKeyListMap(keyframes, 'targetId'))
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

export function slideKeyframesTo<T extends KeyframeBase>(
  keyframes: T[],
  at: number
): T[] {
  if (keyframes.length === 0) return keyframes

  const min = sortKeyframes(keyframes)[0].frame
  return keyframes.map((k) => ({ ...k, frame: k.frame + (at - min) }))
}

export function mergeKeyframesWithDropped(
  src: KeyframeBase[],
  override: KeyframeBase[],
  mergeDeep = false
): { merged: KeyframeBase[]; dropped: KeyframeBase[] } {
  const srcMap = toMap(src)
  const overrideMap = toMap(override)

  const srcMapByFrame = getKeyframeMapByFrame(
    toList(dropMap(srcMap, overrideMap))
  )
  const overrideMapByFrame = getKeyframeMapByFrame(override)
  const overrideMapByNewFrame = dropMap(overrideMapByFrame, srcMapByFrame)

  const droppedMap: IdMap<KeyframeBase> = extractMap(srcMap, overrideMap)
  const dropped: KeyframeBase[] = toList(droppedMap)

  const merged = toList({
    ...mapReduce(srcMapByFrame, (keyframes, frameStr: string) => {
      dropped.push(
        ...dropListByKey(
          keyframes,
          overrideMapByFrame[frameStr] ?? [],
          'targetId',
          true
        )
      )
      const srcMapByTargetId = toKeyMap(keyframes, 'targetId')
      const oveMapByTargetId = toKeyMap(
        overrideMapByFrame[frameStr] ?? [],
        'targetId'
      )

      if (mergeDeep) {
        return Object.keys({
          ...srcMapByTargetId,
          ...oveMapByTargetId,
        }).reduce<KeyframeBase[]>((p, targetId) => {
          if (!oveMapByTargetId[targetId]) {
            p.push(srcMapByTargetId[targetId])
          } else if (!srcMapByTargetId[targetId]) {
            p.push(oveMapByTargetId[targetId])
          } else {
            const merged = mergeKeyframe(
              srcMapByTargetId[targetId],
              oveMapByTargetId[targetId]
            )
            p.push(merged)
          }

          return p
        }, [])
      } else {
        if (overrideMapByFrame[frameStr]) {
          return mergeListByKey(
            keyframes,
            overrideMapByFrame[frameStr] ?? [],
            'targetId'
          )
        } else {
          return keyframes
        }
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
    extractMap(getKeyframeMapByTargetId(keyframes), toMap(bones))
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

export function getLastFrame<T extends KeyframeBase>(keyframes: T[]): number {
  return keyframes.reduce((p, c) => {
    return Math.max(p, c.frame)
  }, 0)
}

export function getSteppedFrame(
  currentFrame: number,
  endFrame: number,
  tickFrame: number,
  reverse = false
): number {
  if (endFrame === 0) return 0
  return circleClamp(0, endFrame, currentFrame + (reverse ? -1 : 1) * tickFrame)
}

export function pastePoseMap(
  nextPoseMapByBoneId: IdMap<Transform>,
  getCurrentPose: (boneId: string) => Transform | undefined
): IdMap<Transform> {
  return Object.keys(nextPoseMapByBoneId).reduce<IdMap<Transform>>((p, c) => {
    const currentPose = getCurrentPose(c)
    if (currentPose) {
      p[c] = multiPoseTransform(
        nextPoseMapByBoneId[c],
        invertPoseTransform(currentPose)
      )
    }
    return p
  }, {})
}
