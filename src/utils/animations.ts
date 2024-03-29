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

import { IVec2, circleClamp } from 'okageo'
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
  isKeyframeBone,
  KeyframeBase,
  KeyframeConstraint,
} from '/@/models/keyframe'
import { subPoseTransform } from '/@/utils/armatures'
import { BoneConstraint, BoneConstraintOption } from '/@/utils/constraints'
import { isIdentityTransform } from '/@/utils/geometry'
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
 * @param raw avoid rounding `frame` if true
 * @return x: frame, y: value
 */
export function canvasToFrameValue(
  p: IVec2,
  valueWidth: number,
  raw = false
): IVec2 {
  return {
    x: !raw ? canvasToNearestFrame(p.x) : canvasToFrame(p.x),
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
  keyframes: KeyframeBase[]
): IdMap<KeyframeBase[]> {
  return sortKeyframeMap(toKeyListMap(keyframes, 'targetId'))
}

export function sortKeyframes<T extends KeyframeBase>(keyframes: T[]): T[] {
  return keyframes.concat().sort((a, b) => a.frame - b.frame)
}

export function sortKeyframeMap(
  keyframeMap: IdMap<KeyframeBase[]>
): IdMap<KeyframeBase[]> {
  return mapReduce(keyframeMap, sortKeyframes)
}

export function getAfterKeyframe(
  sortedKeyframes: KeyframeBase[],
  frame: number
): KeyframeBase | undefined {
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

/**
 * merge the keyframes having the same `frame` and `targetId`
 * `id`: pick from first item
 * `points`: assign from first to last
 *
 * e.g.
 * [
 *   { id: 'a', points: { translateX: tA, rotate: rA } },
 *   { id: 'b', points: { rotate: rB, scaleX: sB } }
 * ]
 * => [{ id: 'a', points: { translateX: tA, rotate: rB, scaleX: sB } }]
 */
export function normalizeKeyframes(src: KeyframeBase[]): KeyframeBase[] {
  const srcByFrame = getKeyframeMapByFrame(src)

  return Object.values(srcByFrame)
    .map((sameFrameList) => {
      const sameFrameTargetMap = toKeyListMap(sameFrameList, 'targetId')
      return Object.values(sameFrameTargetMap).map((sameFrameTarget) => {
        const [head, ...body] = sameFrameTarget
        return body.reduce(
          (p, item) => {
            Object.assign(p.points, item.points)
            return p
          },
          { ...head, points: { ...head.points } }
        )
      })
    })
    .flat()
}

/**
 * each merged items has the same id as in `override`
 */
export function mergeKeyframesWithDropped(
  src: KeyframeBase[],
  override: KeyframeBase[],
  mergeDeep = false
): { merged: KeyframeBase[]; dropped: KeyframeBase[] } {
  const normalizeOverride = normalizeKeyframes(override)

  const srcMap = toMap(src)
  const overrideMap = toMap(normalizeOverride)

  const srcMapByFrame = getKeyframeMapByFrame(
    toList(dropMap(srcMap, overrideMap))
  )
  const overrideMapByFrame = getKeyframeMapByFrame(normalizeOverride)
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
  keyframes: KeyframeBase[],
  armatures: Armature[],
  bones: Bone[]
): { actions: Action[]; keyframes: KeyframeBase[] } {
  const keyframeMap = toMap(keyframes)
  const keyframeMapByActionId = mapReduce(toMap(actions), (a) =>
    a.keyframes.map((id) => keyframeMap[id])
  )
  const armatureMap = toMap(armatures)
  const boneMap = toMap(bones)
  const bonesByArmatureId = mapReduce(armatureMap, (a) =>
    a.bones.map((id) => boneMap[id])
  )

  const validActions = actions.filter(
    (action) => !!armatureMap[action.armatureId]
  )

  const cleanedKeyframes = validActions.flatMap((action) =>
    cleanKeyframes(keyframeMapByActionId[action.id], [
      ...bonesByArmatureId[action.armatureId],
      ...bonesByArmatureId[action.armatureId].flatMap((b) =>
        b.constraints.map((id) => ({ id }))
      ),
    ])
  )

  const cleanedKeyframeMap = toMap(cleanedKeyframes)

  const cleanedActions = validActions.map((action) => ({
    ...action,
    keyframes: action.keyframes.filter((id) => cleanedKeyframeMap[id]),
  }))

  return { actions: cleanedActions, keyframes: cleanedKeyframes }
}

function cleanKeyframes(
  keyframes: KeyframeBase[],
  targets: { id: string }[]
): KeyframeBase[] {
  return toList(
    extractMap(getKeyframeMapByTargetId(keyframes), toMap(targets))
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
  keyframes: KeyframeBase[],
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
      p[c] = subPoseTransform(nextPoseMapByBoneId[c], currentPose)
    }
    return p
  }, {})
}

export function getEditedConstraint(
  src: BoneConstraint,
  edited?: Partial<BoneConstraintOption>
): BoneConstraint {
  if (!edited) return src

  return {
    ...src,
    option: {
      ...src.option,
      influence: edited.influence ?? src.option.influence,
    },
  }
}

export function getEditedKeyframeConstraint(
  src: KeyframeConstraint,
  edited?: Partial<BoneConstraintOption>
): KeyframeConstraint {
  if (!edited) return src

  return {
    ...src,
    points: mapReduce(src.points, (p, key) => {
      if (!p) return
      return {
        ...p,
        value: (edited as any)[key] ?? p.value,
      }
    }),
  }
}

export function resetTransformByKeyframeMap(
  src: IdMap<Transform>,
  keyframeMap: IdMap<KeyframeBase>
): IdMap<Transform> {
  return Object.keys(src).reduce<IdMap<Transform>>((p, id) => {
    const t = resetTransformByKeyframe(src[id], keyframeMap[id])
    if (!isIdentityTransform(t)) {
      p[id] = t
    }
    return p
  }, {})
}

export function resetTransformByKeyframe(
  src: Transform,
  keyframe?: KeyframeBase
): Transform {
  if (!keyframe) return src
  if (!isKeyframeBone(keyframe)) return src

  const translateX = keyframe.points.translateX ? 0 : src.translate.x
  const translateY = keyframe.points.translateY ? 0 : src.translate.y
  const scaleX = keyframe.points.scaleX ? 0 : src.scale.x
  const scaleY = keyframe.points.scaleY ? 0 : src.scale.y
  const rotate = keyframe.points.rotate ? 0 : src.rotate

  return getTransform({
    translate: { x: translateX, y: translateY },
    scale: { x: scaleX, y: scaleY },
    rotate,
    origin: src.origin,
  })
}
