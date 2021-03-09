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

import { v4 } from 'uuid'
import {
  Transform,
  Armature,
  Bone,
  BoneSelectedState,
  getTransform,
  getBone,
  IdMap,
  toMap,
  isBoneSelected,
} from '../models/index'
import {
  add,
  AffineMatrix,
  getPedal,
  getPolygonCenter,
  getRadian,
  interpolateScaler,
  interpolateVector,
  IRectangle,
  isOnPolygon,
  isSame,
  IVec2,
  multi,
  multiAffines,
  rotate,
  sub,
} from 'okageo'
import {
  dropMapIfFalse,
  getParentIdPath,
  getUnduplicatedNameMap,
  hasLeftRightName,
  mapReduce,
  sortByValue,
  symmetrizeName,
  toList,
} from './commons'
import { getNextName } from './relations'
import {
  applyBoneConstraints,
  immigrateConstraints,
  sortBoneByHighDependency,
} from '/@/utils/constraints'

export function boneToAffine(bone: Bone): AffineMatrix {
  const origin = bone.head
  const boneRad = getRadian(bone.tail, bone.head)
  const boneCos = Math.cos(boneRad)
  const boneSin = Math.sin(boneRad)
  const rad = (bone.transform.rotate / 180) * Math.PI
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return multiAffines([
    [1, 0, 0, 1, bone.transform.translate.x, bone.transform.translate.y],
    [1, 0, 0, 1, origin.x, origin.y],
    [cos, sin, -sin, cos, 0, 0],
    [boneCos, boneSin, -boneSin, boneCos, 0, 0],
    [bone.transform.scale.y, 0, 0, bone.transform.scale.x, 0, 0],
    [boneCos, -boneSin, boneSin, boneCos, 0, 0],
    [1, 0, 0, 1, -origin.x, -origin.y],
  ])
}

export function multiPoseTransform(a: Transform, b: Transform): Transform {
  return getTransform({
    scale: { x: a.scale.x * b.scale.x, y: a.scale.y * b.scale.y },
    rotate: a.rotate + b.rotate,
    translate: add(a.translate, b.translate),
  })
}

export function invertScaleOrZero(scale: IVec2): IVec2 {
  return {
    x: scale.x === 0 ? 0 : 1 / scale.x,
    y: scale.y === 0 ? 0 : 1 / scale.y,
  }
}

export function invertPoseTransform(a: Transform): Transform {
  return getTransform({
    scale: invertScaleOrZero(a.scale),
    rotate: -a.rotate,
    translate: multi(a.translate, -1),
  })
}

export function convolutePoseTransforms(transforms: Transform[]): Transform {
  return transforms.reduce((ret, t) => {
    return multiPoseTransform(ret, t)
  }, getTransform())
}

export function applyScale(
  p: IVec2,
  scale: IVec2,
  origin: IVec2 = { x: 0, y: 0 }
): IVec2 {
  return {
    x: origin.x + (p.x - origin.x) * scale.x,
    y: origin.y + (p.y - origin.y) * scale.y,
  }
}

export function applyTransform(p: IVec2, transform: Transform): IVec2 {
  return add(
    rotate(
      applyScale(p, transform.scale, transform.origin),
      (transform.rotate / 180) * Math.PI,
      transform.origin
    ),
    transform.translate
  )
}

export function editTransform(
  bone: Bone,
  transform: Transform,
  selectedState: BoneSelectedState
): Bone {
  const head = selectedState.head
    ? applyTransform(bone.head, transform)
    : bone.head
  const tail = selectedState.tail
    ? applyTransform(bone.tail, transform)
    : bone.tail

  return {
    ...bone,
    head,
    tail,
  }
}

export function posedTransform(bone: Bone, transforms: Transform[]): Bone {
  const convoluted = convolutePoseTransforms(transforms)
  const head = applyTransform(
    bone.head,
    getTransform({ translate: convoluted.translate })
  )
  const tail = applyTransform(
    bone.tail,
    getTransform({ ...convoluted, origin: bone.head, scale: { x: 1, y: 1 } })
  )

  return {
    ...bone,
    head,
    tail: add(multi(sub(tail, head), convoluted.scale.y), head),
    transform: getTransform({
      // scale x does not affect bone's head and tail
      // => it affects bone's width
      scale: { x: convoluted.scale.x, y: 1 },
    }),
  }
}

export function applyPosedTransformToPoint(parent: Bone, point: IVec2): IVec2 {
  const head = applyTransform(
    parent.head,
    getTransform({ translate: parent.transform.translate })
  )
  const tail = applyTransform(
    parent.tail,
    getTransform({
      ...parent.transform,
      origin: parent.head,
      scale: { x: 1, y: 1 },
    })
  )
  const rotatedAndTranslatedPoint = applyTransform(
    point,
    getTransform({
      ...parent.transform,
      origin: parent.head,
      scale: { x: 1, y: 1 },
    })
  )
  if (isSame(head, tail)) {
    return rotatedAndTranslatedPoint
  }

  const pedal = getPedal(rotatedAndTranslatedPoint, [head, tail])
  // scale y affects bone's height
  const vecY = sub(pedal, head)
  // scale x affects bone's width
  const vecX = sub(rotatedAndTranslatedPoint, pedal)

  return add(
    add(
      multi(vecY, parent.transform.scale.y),
      multi(vecX, parent.transform.scale.x)
    ),
    head
  )
}

export function extrudeFromParent(parent: Bone, fromHead = false): Bone {
  const head = fromHead ? parent.head : parent.tail
  return getBone(
    {
      head,
      tail: head,
      parentId: fromHead ? parent.parentId : parent.id,
      connected: fromHead ? parent.connected : true,
    },
    true
  )
}

export function findBone(bones: Bone[], id: string): Bone | undefined {
  return bones.find((b) => b.id === id)
}

export function findChildren(
  armature: Armature,
  id: string,
  onlyConnected = false
): Bone[] {
  return armature.bones.filter(
    (b) => b.parentId === id && (!onlyConnected || b.connected)
  )
}

export function adjustConnectedPosition(bones: Bone[]): Bone[] {
  return bones.map((b) => {
    if (!b.connected) return b
    return {
      ...b,
      head: b.connected ? findBone(bones, b.parentId)?.tail ?? b.head : b.head,
    }
  })
}

export function selectBone(
  armature: Armature,
  id: string,
  selectedState: BoneSelectedState,
  ignoreConnection = false
): IdMap<BoneSelectedState> {
  const target = findBone(armature.bones, id)
  if (!target) return {}

  let ret: IdMap<Partial<BoneSelectedState>> = {
    [id]: selectedState,
  }

  if (!ignoreConnection) {
    if (selectedState.head && target.connected) {
      const parent = findBone(armature.bones, target.parentId)
      if (parent) {
        ret = {
          ...selectBone(armature, parent.id, { tail: true }, ignoreConnection),
          ...ret,
        }
      }
    }
    if (selectedState.tail) {
      findChildren(armature, target.id, true).forEach((b) => {
        ret[b.id] = { head: true }
      })
    }
  }

  return ret
}

export function selectBoneInRect(
  rect: IRectangle,
  boneMap: IdMap<Bone>
): IdMap<BoneSelectedState> {
  const polygon = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ]
  return toList(boneMap).reduce<IdMap<BoneSelectedState>>((p, b) => {
    const transformed = posedTransform(b, [b.transform])
    const head = isOnPolygon(transformed.head, polygon)
    const tail = isOnPolygon(transformed.tail, polygon)
    if (head || tail) {
      p[b.id] = { head, tail }
      if (!head) delete p[b.id].head
      if (!tail) delete p[b.id].tail
    }
    return p
  }, {})
}

export function fixConnection(bones: Bone[], b: Bone): Bone {
  if (!b.connected) return b

  const parent = findBone(bones, b.parentId)
  if (!parent) return { ...b, connected: false, parentId: '' }

  return { ...b, head: parent.tail }
}
export function fixConnections(bones: Bone[]): Bone[] {
  return bones.map((b) => fixConnection(bones, b))
}

export function updateConnections(bones: Bone[]): IdMap<Partial<Bone>> {
  return bones.reduce<IdMap<Partial<Bone>>>((p, b) => {
    const parent = findBone(bones, b.parentId)
    if (!parent) {
      if (b.connected) p[b.id] = { connected: false, parentId: '' }
    } else if (b.connected) {
      p[b.id] = { connected: isSame(parent.tail, b.head) }
    }
    return p
  }, {})
}

export function getSelectedBonesOrigin(
  boneMap: IdMap<Bone>,
  selectedState: IdMap<BoneSelectedState>
): IVec2 {
  const selectedPoints = Object.keys(selectedState)
    .map((id) => {
      const selected = []
      const posed = posedTransform(boneMap[id], [boneMap[id].transform])
      if (selectedState[id].head) selected.push(posed.head)
      if (selectedState[id].tail) selected.push(posed.tail)
      return selected
    })
    .flat()

  return getPolygonCenter(selectedPoints)
}

export function getPosedBoneHeadsOrigin(boneMap: IdMap<Bone>): IVec2 {
  const points = Object.keys(boneMap).map(
    (id) => posedTransform(boneMap[id], [boneMap[id].transform]).head
  )

  return getPolygonCenter(points)
}

interface TreeNode {
  id: string
  children: TreeNode[]
}

export function getTree<T extends { id: string; parentId: string }>(
  idMap: IdMap<T>
): TreeNode[] {
  const noParents: T[] = []
  const parentMap: IdMap<T[]> = Object.keys(idMap).reduce<IdMap<T[]>>(
    (p, c) => {
      const b = idMap[c]
      if (!b.parentId || !idMap[b.parentId]) {
        noParents.push(b)
      } else if (p[b.parentId]) {
        p[b.parentId].push(b)
      } else {
        p[b.parentId] = [b]
      }
      return p
    },
    {}
  )

  return noParents.map((b) => {
    return { ...b, children: getChildNodes(parentMap, b.id) }
  })
}

function getChildNodes<T extends { id: string; parentId: string }>(
  parentMap: IdMap<T[]>,
  parentId: string
): TreeNode[] {
  return (
    parentMap[parentId]?.map((b) => {
      return { ...b, children: getChildNodes(parentMap, b.id) }
    }) ?? []
  )
}

interface BoneNode extends Bone, TreeNode {
  children: BoneNode[]
}

export function getTransformedBoneMap(boneMap: IdMap<Bone>): IdMap<Bone> {
  return sortBoneByHighDependency(toList(boneMap)).reduce((p, c) => {
    return resolveBonePose(boneMap, p, c.id)
  }, {})
}

/**
 * @return next resolved bones map
 */
function resolveBonePose(
  originalMap: IdMap<Bone>,
  resolvedMap: IdMap<Bone>,
  boneId: string
): IdMap<Bone> {
  if (resolvedMap[boneId]) return resolvedMap

  let ret = resolvedMap
  const b = originalMap[boneId]

  if (b.parentId) {
    if (!ret[b.parentId]) {
      // a parent of the target must be resolved earlier
      ret = {
        ...ret,
        ...resolveBonePose(originalMap, ret, b.parentId),
      }
    }

    ret = {
      ...ret,
      [boneId]: extendTransform(ret[b.parentId], b),
    }
  } else {
    ret = { ...ret, [boneId]: b }
  }

  ret = {
    ...ret,
    ...applyBoneConstraints(originalMap, ret, boneId),
  }
  return ret
}

export function extendTransform(parent: Bone, child: Bone): Bone {
  const childPosedHead = add(child.head, child.transform.translate)
  const appliedChildHead = applyPosedTransformToPoint(parent, child.head)
  const headDiff = sub(appliedChildHead, childPosedHead)

  return {
    ...child,
    transform: {
      translate: add(child.transform.translate, headDiff),
      rotate: child.inheritRotation
        ? child.transform.rotate + parent.transform.rotate
        : child.transform.rotate,
      scale: {
        x: child.transform.scale.x * parent.transform.scale.x,
        y: child.transform.scale.y * parent.transform.scale.y,
      },
      origin: { x: 0, y: 0 },
    },
  }
}

function flatBoneTree(children: BoneNode[]): Bone[] {
  return children
    .map((b) => {
      const { children, ...bone } = b
      return bone
    })
    .concat(children.flatMap((c) => flatBoneTree(c.children)))
}

export function getAnySelectedBones(
  boneMap: IdMap<Bone>,
  selectedState: IdMap<BoneSelectedState>
): IdMap<Bone> {
  return dropMapIfFalse(boneMap, (b) => isBoneSelected(selectedState[b.id]))
}

export function getAllSelectedBones(
  boneMap: IdMap<Bone>,
  selectedState: IdMap<BoneSelectedState>
): IdMap<Bone> {
  return dropMapIfFalse(boneMap, (b) =>
    isBoneSelected(selectedState[b.id], true)
  )
}

export function getPoseSelectedBones(
  boneMap: IdMap<Bone>,
  selectedState: IdMap<BoneSelectedState>
): IdMap<Bone> {
  return toMap(
    filterPoseSelectedBone(getTree(boneMap) as BoneNode[], selectedState)
  )
}

function filterPoseSelectedBone(
  boneTree: BoneNode[],
  selectedState: IdMap<BoneSelectedState>
): Bone[] {
  return boneTree.flatMap((node) => {
    if (isBoneSelected(selectedState[node.id])) {
      const { children, ...bone } = node
      return [bone]
    } else {
      return filterPoseSelectedBone(node.children, selectedState)
    }
  })
}

export function interpolateTransform(
  a: Transform,
  b: Transform,
  rate: number
): Transform {
  return getTransform({
    scale: interpolateVector(a.scale, b.scale, rate),
    rotate: interpolateScaler(a.rotate, b.rotate, rate),
    translate: interpolateVector(a.translate, b.translate, rate),
  })
}

export function immigrateBoneRelations(
  duplicatedIdMap: IdMap<string>,
  bones: Bone[]
): Bone[] {
  return bones.map((src) => {
    // switch new parent if current parent is duplicated together
    const parentId = duplicatedIdMap[src.parentId] ?? src.parentId
    // connect if current parent is duplicated together
    const connected = src.connected && !!duplicatedIdMap[src.parentId]

    return {
      ...src,
      parentId,
      connected,
      constraints: immigrateConstraints(duplicatedIdMap, src.constraints),
    }
  })
}

/**
 * @return duplicated bones
 */
export function duplicateBones(srcBones: IdMap<Bone>, names: string[]): Bone[] {
  const duplicatedIdMap = mapReduce(srcBones, () => v4())
  return immigrateBoneRelations(
    duplicatedIdMap,
    toList(
      mapReduce(srcBones, (src) => {
        const b = {
          ...src,
          id: duplicatedIdMap[src.id],
          name: getNextName(src.name, names),
        }
        names.push(b.name)
        return b
      })
    ).sort((a, b) => (a.name >= b.name ? 1 : -1))
  )
}

/**
 * @return symmetrized bones
 */
export function symmetrizeBones(
  boneMap: IdMap<Bone>,
  selectedIds: string[]
): Bone[] {
  const symmetrizedIdMap = selectedIds
    .filter((id) => canSymmetrize(boneMap, id))
    .reduce<{ [id: string]: string }>((p, c) => ({ ...p, [c]: v4() }), {})

  const newBones = immigrateBoneRelations(
    symmetrizedIdMap,
    Object.keys(symmetrizedIdMap)
      .map((id) => {
        const b = boneMap[id]
        const name = symmetrizeName(b.name)
        // symmetrize at root parent's tail
        const parentPath = getParentIdPath(boneMap, b.id)
        return getBone({
          ...symmetrizeBone(
            b,
            parentPath[0] ? boneMap[parentPath[0]].tail : b.head
          ),
          id: symmetrizedIdMap[id],
          name,
        })
      })
      .filter((b): b is Bone => !!b)
  )

  const nameMap = getUnduplicatedNameMap(
    Object.keys(boneMap).map((k) => boneMap[k].name),
    newBones.map((b) => b.name)
  )

  return newBones.map((b) => ({ ...b, name: nameMap[b.name] }))
}

function canSymmetrize(boneMap: IdMap<Bone>, id: string): boolean {
  if (!boneMap[id]) return false
  if (!boneMap[id].name) return false
  if (!hasLeftRightName(boneMap[id].name)) return false
  if (getParentIdPath(boneMap, id).length === 0) return false
  return true
}

export function symmetrizeBone(bone: Bone, origin: IVec2): Bone {
  const translate = {
    x: sub(origin, bone.head).x * 2,
    y: 0,
  }
  const head = add(bone.head, translate)
  const tail = {
    x: add(add(bone.tail, translate), multi(sub(bone.head, bone.tail), 2)).x,
    y: bone.tail.y,
  }
  return {
    ...bone,
    head,
    tail,
  }
}

export function getBoneIdsWithoutDescendants(
  boneMap: IdMap<Bone>,
  targetId: string
): string[] {
  const tree = getTree({
    ...boneMap,
    [targetId]: { ...boneMap[targetId], parentId: '' },
  }) as BoneNode[]
  return sortBoneByName(
    flatBoneTree(tree.filter((b) => b.id !== targetId))
  ).map((b) => b.id)
}

export function sortBoneByName(bones: Bone[]): Bone[] {
  return sortByValue(bones, 'name')
}
