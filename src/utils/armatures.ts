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
  getPolygonCenter,
  interpolateScaler,
  interpolateVector,
  isSame,
  IVec2,
  multi,
  rotate,
  sub,
} from 'okageo'
import { dropMapIfFalse, mapReduce, toList } from './commons'
import { getNextName } from './relations'

export function multiPoseTransform(a: Transform, b: Transform): Transform {
  return getTransform({
    scale: { x: a.scale.x * b.scale.x, y: a.scale.y * b.scale.y },
    rotate: a.rotate + b.rotate,
    translate: add(a.translate, b.translate),
  })
}

export function invertPoseTransform(a: Transform): Transform {
  return getTransform({
    scale: {
      x: a.scale.x === 0 ? 0 : 1 / a.scale.x,
      y: a.scale.y === 0 ? 0 : 1 / a.scale.y,
    },
    rotate: -a.rotate,
    translate: multi(a.translate, -1),
  })
}

export function convolutePoseTransforms(transforms: Transform[]): Transform {
  return transforms.reduce((ret, t) => {
    return multiPoseTransform(ret, t)
  }, getTransform())
}

function scale(p: IVec2, scale: IVec2, origin: IVec2 = { x: 0, y: 0 }): IVec2 {
  return {
    x: origin.x + (p.x - origin.x) * scale.x,
    y: origin.y + (p.y - origin.y) * scale.y,
  }
}

export function applyTransform(p: IVec2, transform: Transform): IVec2 {
  return add(
    rotate(
      scale(p, transform.scale, transform.origin),
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
    getTransform({ ...convoluted, origin: bone.head })
  )

  return {
    ...bone,
    head,
    tail,
    transform: getTransform(),
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
): IdMap<Partial<BoneSelectedState>> {
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
  return toMap(flatBoneTree(getTransformBoneTree(boneMap)))
}

function getTransformBoneTree(boneMap: IdMap<Bone>): BoneNode[] {
  return (getTree<Bone>(boneMap) as BoneNode[]).map((b) => {
    return { ...b, children: getChildTransforms(b) }
  })
}

function getChildTransforms(parent: BoneNode): BoneNode[] {
  return (
    parent.children.map((b) => {
      const extended = extendTransform(parent, b)
      return {
        ...extended,
        children: getChildTransforms({
          ...extended,
          children: b.children,
        }),
      }
    }) ?? []
  )
}

export function extendTransform(parent: Bone, child: Bone): Bone {
  const childPosedHead = add(child.head, child.transform.translate)
  const appliedChildHead = applyTransform(childPosedHead, {
    ...parent.transform,
    origin: parent.head,
  })
  const headDiff = sub(appliedChildHead, childPosedHead)
  return {
    ...child,
    transform: {
      translate: add(child.transform.translate, headDiff),
      rotate: child.transform.rotate + parent.transform.rotate,
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

export function duplicateBones(srcBones: IdMap<Bone>, names: string[]): Bone[] {
  const duplicatedIdMap = mapReduce(srcBones, () => v4())
  return toList(
    mapReduce(srcBones, (src) => {
      // switch new parent if current parent is duplicated together
      const parentId = duplicatedIdMap[src.parentId] ?? src.parentId
      // connect if current parent is duplicated together
      const connected = src.connected && !!duplicatedIdMap[src.parentId]
      const b = getBone({
        ...src,
        id: duplicatedIdMap[src.id],
        parentId,
        connected,
        name: getNextName(src.name, names),
      })
      names.push(b.name)
      return b
    })
  ).sort((a, b) => (a.name >= b.name ? 1 : -1))
}
