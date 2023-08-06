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

import { generateUuid } from '/@/utils/random'
import {
  Transform,
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
  getCenter,
  getPolygonCenter,
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
  mapFilter,
  getParentIdPath,
  hasLeftRightName,
  mapReduce,
  sortByValue,
  symmetrizeName,
  toList,
  extractMap,
} from './commons'
import { getNotDuplicatedName, TreeNode } from './relations'
import {
  applyBoneConstraints,
  BoneConstraint,
  getDependentCountMap,
  immigrateConstraints,
  sortBoneByHighDependency,
} from '/@/utils/constraints'
import {
  applyPosedTransformToPoint,
  applyTransform,
  applyTransformToVec,
  getBoneSquaredSize,
  getBoneXRadian,
  invertScaleOrZero,
  toBoneSpaceFn,
} from '/@/utils/geometry'

export function boneToAffine(bone: Bone): AffineMatrix {
  const origin = bone.head
  const boneRad = getBoneXRadian(bone)
  const boneCos = Math.cos(boneRad)
  const boneSin = Math.sin(boneRad)
  const rad = (bone.transform.rotate / 180) * Math.PI
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return multiAffines([
    [1, 0, 0, 1, origin.x, origin.y],
    [boneCos, boneSin, -boneSin, boneCos, 0, 0],
    [1, 0, 0, 1, bone.transform.translate.x, bone.transform.translate.y],
    [cos, sin, -sin, cos, 0, 0],
    // this rotation is correct for bone's posing space
    [bone.transform.scale.x, 0, 0, bone.transform.scale.y, 0, 0],
    [boneCos, -boneSin, boneSin, boneCos, 0, 0],
    [1, 0, 0, 1, -origin.x, -origin.y],
  ])
}

export function addPoseTransform(a: Transform, b: Transform): Transform {
  return getTransform({
    scale: add(a.scale, b.scale),
    rotate: a.rotate + b.rotate,
    translate: add(a.translate, b.translate),
    origin: add(a.origin, b.origin),
  })
}

export function subPoseTransform(a: Transform, b: Transform): Transform {
  return getTransform({
    scale: sub(a.scale, b.scale),
    rotate: a.rotate - b.rotate,
    translate: sub(a.translate, b.translate),
    origin: sub(a.origin, b.origin),
  })
}

export function multiPoseTransform(a: Transform, b: Transform): Transform {
  return getTransform({
    scale: { x: a.scale.x * b.scale.x, y: a.scale.y * b.scale.y },
    rotate: a.rotate + b.rotate,
    translate: add(a.translate, b.translate),
    origin: add(a.origin, b.origin),
  })
}

export function invertPoseTransform(a: Transform): Transform {
  return getTransform({
    scale: invertScaleOrZero(a.scale),
    rotate: -a.rotate,
    translate: multi(a.translate, -1),
    origin: multi(a.origin, -1),
  })
}

export function convolutePoseTransforms(transforms: Transform[]): Transform {
  return transforms.reduce((ret, t) => {
    return multiPoseTransform(ret, t)
  }, getTransform())
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
  const boneRad = getBoneXRadian(bone)

  const worldTranslate = rotate(convoluted.translate, boneRad)
  const head = applyTransform(
    bone.head,
    getTransform({ translate: worldTranslate })
  )
  const tail = applyTransform(
    bone.tail,
    getTransform({
      ...convoluted,
      translate: worldTranslate,
      origin: bone.head,
      scale: { x: 1, y: 1 },
    })
  )

  return {
    ...bone,
    head,
    tail: add(multi(sub(tail, head), convoluted.scale.y), head),
    transform: getTransform({
      // Original bone's width is derived from its height: the distance between head and tail
      // Scale x affects its width as well
      // => Divide the width by scale y to negate the pose transformation of the height
      scale: {
        x:
          convoluted.scale.y === 0
            ? 0
            : convoluted.scale.x / convoluted.scale.y,
        y: 1,
      },
    }),
  }
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

function findChildren(
  bones: Bone[],
  parentId: string,
  onlyConnected = false
): Bone[] {
  return bones.filter(
    (b) => b.parentId === parentId && (!onlyConnected || b.connected)
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
  bones: Bone[],
  id: string,
  selectedState: BoneSelectedState,
  ignoreConnection = false
): IdMap<BoneSelectedState> {
  const target = findBone(bones, id)
  if (!target || Object.keys(selectedState).length === 0) return {}

  let ret: IdMap<Partial<BoneSelectedState>> = {
    [id]: selectedState,
  }

  if (!ignoreConnection) {
    if (selectedState.head && target.connected) {
      const parent = findBone(bones, target.parentId)
      if (parent) {
        ret = {
          ...selectBone(bones, parent.id, { tail: true }, ignoreConnection),
          ...ret,
        }
      }
    }
    if (selectedState.tail) {
      findChildren(bones, target.id, true).forEach((b) => {
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
      p[b.id] = cleanBoneSelectedStatus({ head, tail })
      if (!head) delete p[b.id].head
      if (!tail) delete p[b.id].tail
    }
    return p
  }, {})
}

export function getBoneWrapperRect(bone: Bone): IRectangle {
  const transformed = posedTransform(bone, [bone.transform])
  const h = transformed.head
  const t = transformed.tail
  const xMin = Math.min(h.x, t.x)
  const xMax = Math.max(h.x, t.x)
  const yMin = Math.min(h.y, t.y)
  const yMax = Math.max(h.y, t.y)
  return { x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin }
}

export function fixConnection(bones: Bone[], b: Bone): Bone {
  if (!b.parentId && !b.connected) return b

  const parent = findBone(bones, b.parentId)
  if (!parent) return { ...b, connected: false, parentId: '' }

  return b.connected ? { ...b, head: parent.tail } : b
}
export function fixConnections(bones: Bone[]): Bone[] {
  return bones.map((b) => fixConnection(bones, b))
}

export function updateConnections(bones: Bone[]): IdMap<Partial<Bone>> {
  return bones.reduce<IdMap<Partial<Bone>>>((p, b) => {
    if (!b.parentId) return p

    const parent = findBone(bones, b.parentId)
    if (!parent) {
      p[b.id] = { connected: false, parentId: '' }
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

export function getTree<
  T extends { id: string; name: string; parentId: string },
>(idMap: IdMap<T>): TreeNode[] {
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

function getChildNodes<
  T extends { id: string; name: string; parentId: string },
>(parentMap: IdMap<T[]>, parentId: string): TreeNode[] {
  return (
    parentMap[parentId]?.map((b) => {
      return { ...b, children: getChildNodes(parentMap, b.id) }
    }) ?? []
  )
}

interface BoneNode extends Bone, TreeNode {
  children: BoneNode[]
}

export function getTransformedBoneMap(
  boneMap: IdMap<Bone>,
  constraintMap: IdMap<BoneConstraint>
): IdMap<Bone> {
  return sortBoneByHighDependency(toList(boneMap), constraintMap).reduce(
    (p, c) => {
      return resolveBonePose(boneMap, p, constraintMap, c.id)
    },
    {}
  )
}

/**
 * @return next resolved bones map
 */
function resolveBonePose(
  originalMap: IdMap<Bone>,
  resolvedMap: IdMap<Bone>,
  constraintMap: IdMap<BoneConstraint>,
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
        ...resolveBonePose(originalMap, ret, constraintMap, b.parentId),
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
    ...applyBoneConstraints(originalMap, ret, constraintMap, boneId),
  }
  return ret
}

export function extendTransform(parent: Bone, child: Bone): Bone {
  const toSpaceFn = toBoneSpaceFn(child)

  const childBaseTranslate = child.connected
    ? { x: 0, y: 0 }
    : child.transform.translate
  const posedHead = add(child.head, toSpaceFn.toWorld(childBaseTranslate))
  const extendedPosedHead = applyPosedTransformToPoint(parent, posedHead)
  const headDiff = sub(extendedPosedHead, posedHead)

  return {
    ...child,
    transform: {
      translate: add(childBaseTranslate, toSpaceFn.toLocal(headDiff)),
      rotate: child.inheritRotation
        ? child.transform.rotate + parent.transform.rotate
        : child.transform.rotate,
      scale: child.inheritScale
        ? {
            x: child.transform.scale.x * parent.transform.scale.x,
            y: child.transform.scale.y * parent.transform.scale.y,
          }
        : child.transform.scale,
      origin: { x: 0, y: 0 },
    },
  }
}

function flatBoneTree(children: BoneNode[]): Bone[] {
  return children
    .map((b) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { children, ...bone } = b
      return bone
    })
    .concat(children.flatMap((c) => flatBoneTree(c.children)))
}

export function getAnySelectedBones(
  boneMap: IdMap<Bone>,
  selectedState: IdMap<BoneSelectedState>
): IdMap<Bone> {
  return mapFilter(boneMap, (b) => isBoneSelected(selectedState[b.id]))
}

export function getAllSelectedBones(
  boneMap: IdMap<Bone>,
  selectedState: IdMap<BoneSelectedState>
): IdMap<Bone> {
  return mapFilter(boneMap, (b) => isBoneSelected(selectedState[b.id], true))
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    origin: interpolateVector(a.origin, b.origin, rate),
    translate: interpolateVector(a.translate, b.translate, rate),
  })
}

export function immigrateBoneRelations(
  immigratedIdMap: IdMap<string>,
  bones: Bone[],
  constraintMap: IdMap<BoneConstraint>,
  options: {
    resetConstraintId?: boolean
  } = {}
): { bones: Bone[]; constraints: BoneConstraint[] } {
  const createdConstraintsByBoneId = mapReduce(toMap(bones), (src) => {
    return immigrateConstraints(
      immigratedIdMap,
      src.constraints.map((id) => constraintMap[id]),
      (src) => (options.resetConstraintId ? generateUuid() : src.id)
    )
  })

  const updated = bones.map((src) => {
    return {
      ...src,
      parentId: immigratedIdMap[src.parentId] ?? src.parentId,
      constraints: createdConstraintsByBoneId[src.id].map((c) => c.id),
    }
  })

  return {
    bones: updated,
    constraints: toList(createdConstraintsByBoneId).flat(),
  }
}

/**
 * @return duplicated bones
 */
export function duplicateBones(
  srcBones: IdMap<Bone>,
  constraintMap: IdMap<BoneConstraint>,
  names: string[]
): { bones: Bone[]; createdConstraints: BoneConstraint[] } {
  const duplicatedIdMap = mapReduce(srcBones, () => generateUuid())
  const nextIdMap = Object.values(duplicatedIdMap).reduce<{
    [id: string]: boolean
  }>((p, id) => {
    p[id] = true
    return p
  }, {})

  const immigrated = immigrateBoneRelations(
    duplicatedIdMap,
    toList(
      mapReduce(srcBones, (src) => {
        const b = {
          ...src,
          id: duplicatedIdMap[src.id],
          name: getNotDuplicatedName(src.name, names),
        }
        names.push(b.name)
        return b
      })
    ).sort((a, b) => (a.name >= b.name ? 1 : -1)),
    constraintMap,
    { resetConstraintId: true }
  )

  return {
    bones: immigrated.bones.map((b) => {
      // set connected false if the parent is not duplicated together
      if (!b.parentId || nextIdMap[b.parentId]) return b
      return { ...b, connected: false }
    }),
    createdConstraints: immigrated.constraints,
  }
}

/**
 * @return symmetrized bones
 */
export function symmetrizeBones(
  boneMap: IdMap<Bone>,
  constraintMap: IdMap<BoneConstraint>,
  selectedIds: string[]
): { bones: Bone[]; createdConstraints: BoneConstraint[] } {
  const currentNameIdMap = Object.keys(boneMap).reduce<{
    [name: string]: string
  }>((p, id) => {
    p[boneMap[id].name] = id
    return p
  }, {})

  const symmetrizedIdMap: { [id: string]: string } = {}
  const symmetrizedNameMap: { [id: string]: string } = {}

  selectedIds.forEach((id) => {
    if (canSymmetrize(boneMap, id)) {
      const name = symmetrizeName(boneMap[id].name)
      if (currentNameIdMap[name]) {
        // override current bone and inherit the id
        symmetrizedIdMap[id] = currentNameIdMap[name]
      } else {
        symmetrizedIdMap[id] = generateUuid()
      }
      symmetrizedNameMap[id] = name
    }
  })

  const symmetrizedList = Object.keys(symmetrizedIdMap).map((id) => {
    const b = boneMap[id]
    const name = symmetrizedNameMap[id]
    // symmetrize at the tail of the root node
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

  const immigrated = immigrateBoneRelations(
    getSymmetrizedIdMap({ ...boneMap, ...toMap(symmetrizedList) }, true),
    symmetrizedList,
    constraintMap,
    { resetConstraintId: true }
  )

  const updatedConnections = updateConnections(
    toList({ ...boneMap, ...toMap(immigrated.bones) })
  )

  return {
    bones: immigrated.bones.map((b) =>
      updatedConnections[b.id] ? { ...b, ...updatedConnections[b.id] } : b
    ),
    createdConstraints: immigrated.constraints,
  }
}

export function getSymmetrizedIdMap(
  srcMap: IdMap<{ id: string; name: string }>,
  includeAllIds = false
): { [id: string]: string } {
  const nextMapByName = Object.keys(srcMap).reduce<{ [id: string]: string }>(
    (p, id) => {
      const name = symmetrizeName(srcMap[id].name)
      if (name !== srcMap[id].name) {
        p[symmetrizeName(srcMap[id].name)] = id
      }
      return p
    },
    {}
  )

  return Object.keys(srcMap).reduce<{ [id: string]: string }>((p, id) => {
    const next = nextMapByName[srcMap[id].name]
    if (next) {
      p[id] = next
    } else if (includeAllIds) {
      p[id] = id
    }
    return p
  }, {})
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
  const tree = getTree(
    boneMap[targetId]
      ? {
          ...boneMap,
          [targetId]: { ...boneMap[targetId], parentId: '' },
        }
      : boneMap
  ) as BoneNode[]
  return sortBoneByName(
    flatBoneTree(tree.filter((b) => b.id !== targetId))
  ).map((b) => b.id)
}

export function sortBoneByName(bones: Bone[]): Bone[] {
  return sortByValue(bones, 'name')
}

/**
 * @return Upserted bones
 */
function reduceUpdateEntities(
  boneMap: IdMap<Bone>,
  constraintMap: IdMap<BoneConstraint>,
  targetIds: string[],
  updatePartialFn: (
    arg: IdMap<Bone>,
    constraintMap: IdMap<BoneConstraint>,
    targetId: string
  ) => { bones: IdMap<Bone>; constraints: IdMap<BoneConstraint> }
): { bones: IdMap<Bone>; constraints: IdMap<BoneConstraint> } {
  const upsertedIdMap: { [id: string]: true } = {}
  const upsertedConstraintIdMap: { [id: string]: true } = {}

  const allMap = targetIds.reduce<{
    bones: IdMap<Bone>
    constraints: IdMap<BoneConstraint>
  }>(
    (p, targetId) => {
      const upsertedMap = updatePartialFn(p.bones, p.constraints, targetId)
      Object.keys(upsertedMap.bones).forEach((id) => {
        upsertedIdMap[id] = true
        p.bones[id] = upsertedMap.bones[id]
      })
      Object.keys(upsertedMap.constraints).forEach((id) => {
        upsertedConstraintIdMap[id] = true
        p.constraints[id] = upsertedMap.constraints[id]
      })
      return p
    },
    { bones: { ...boneMap }, constraints: { ...constraintMap } }
  )

  return {
    bones: extractMap(allMap.bones, upsertedIdMap),
    constraints: extractMap(allMap.constraints, upsertedIdMap),
  }
}

/**
 * @return Upserted bones
 */
export function subdivideBones(
  boneMap: IdMap<Bone>,
  targetIds: string[],
  generateId: () => string = generateUuid
): IdMap<Bone> {
  return reduceUpdateEntities(boneMap, {}, targetIds, (p, _, targetId) => {
    return { bones: subdivideBone(p, targetId, generateId), constraints: {} }
  }).bones
}

/**
 * @return Upserted bones
 */
export function subdivideBone(
  boneMap: IdMap<Bone>,
  targetId: string,
  generateId: () => string = generateUuid
): IdMap<Bone> {
  const target = boneMap[targetId]
  if (!target) return boneMap

  const [b1, b2] = splitBone(
    target,
    toList(boneMap).map((b) => b.name),
    generateId
  )

  return {
    ...toMap(
      toList(boneMap)
        .filter((b) => b.parentId === targetId)
        .map((b) => ({ ...b, parentId: b2.id }))
    ),
    [b1.id]: b1,
    [b2.id]: b2,
  }
}

function splitBone(
  src: Bone,
  names: string[],
  generateId: () => string
): [head: Bone, tail: Bone] {
  const center = getCenter(src.head, src.tail)
  return [
    getBone({
      ...src,
      tail: center,
    }),
    getBone({
      ...src,
      id: generateId(),
      name: getNotDuplicatedName(src.name, names),
      head: center,
      parentId: src.id,
      connected: true,
      constraints: [],
      inheritRotation: true,
      inheritScale: true,
    }),
  ]
}

/**
 * @return Updated entities
 */
export function getUpdatedBonesByDissolvingBones(
  boneMap: IdMap<Bone>,
  constraintMap: IdMap<BoneConstraint>,
  targetIds: string[]
): { bones: IdMap<Bone>; constraints: IdMap<BoneConstraint> } {
  return reduceUpdateEntities(
    boneMap,
    constraintMap,
    targetIds,
    getUpdatedBonesByDissolvingBone
  )
}

/**
 * @return Updated bones
 */
export function getUpdatedBonesByDissolvingBone(
  boneMap: IdMap<Bone>,
  constraintMap: IdMap<BoneConstraint>,
  targetId: string
): { bones: IdMap<Bone>; constraints: IdMap<BoneConstraint> } {
  const target = boneMap[targetId]
  if (!target) return { bones: {}, constraints: {} }

  const dependentBoneIdMap = mapFilter(
    getDependentCountMap(boneMap, constraintMap),
    (map) => targetId in map
  )

  const ret = immigrateBoneRelations(
    { [targetId]: target.parentId },
    toList(boneMap)
      .filter((b) => !!dependentBoneIdMap[b.id])
      // replace bone's head to new parent's tail if the connected parent will be dissolved
      .map((b) => {
        if (b.parentId !== targetId || !b.connected) return b

        const parent = boneMap[targetId]
        if (!parent.parentId) return { ...b, parentId: '', connected: false }

        const newParent = boneMap[parent.parentId]
        if (!newParent) return b

        return { ...b, parentId: parent.parentId, head: newParent.tail }
      }),
    constraintMap
  )

  return {
    bones: toMap(ret.bones),
    constraints: toMap(ret.constraints),
  }
}

export function sortBoneBySize(bones: Bone[]): Bone[] {
  return bones.concat().sort((a, b) => {
    return getBoneSquaredSize(b) - getBoneSquaredSize(a)
  })
}

export function getShiftClickedBoneState(
  current: BoneSelectedState,
  clicked: BoneSelectedState
): BoneSelectedState {
  if (clicked.head && clicked.tail) {
    return current.head && current.tail ? {} : { head: true, tail: true }
  }

  return cleanBoneSelectedStatus({
    head: clicked.head ? !current.head : current.head,
    tail: clicked.tail ? !current.tail : current.tail,
  })
}

export function getWorldToLocalTranslateFn(
  bone: Bone,
  parentSpace?: Transform
): (v: IVec2) => IVec2 {
  const toSpaceFn = toBoneSpaceFn(bone)
  if (!parentSpace) return (v) => toSpaceFn.toLocal(v)

  const invP = invertPoseTransform(parentSpace)
  return (v) => toSpaceFn.toLocal(applyTransformToVec(v, invP))
}

function cleanBoneSelectedStatus(state: {
  head?: boolean
  tail?: boolean
}): BoneSelectedState {
  const ret: BoneSelectedState = {}
  if (state.head) {
    ret.head = true
  }
  if (state.tail) {
    ret.tail = true
  }
  return ret
}
