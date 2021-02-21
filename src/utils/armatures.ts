import { v4 } from 'uuid'
import {
  Transform,
  Armature,
  Born,
  BornSelectedState,
  getTransform,
  getBorn,
  IdMap,
  toMap,
  isBornSelected,
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
  born: Born,
  transform: Transform,
  selectedState: BornSelectedState
): Born {
  const head = selectedState.head
    ? applyTransform(born.head, transform)
    : born.head
  const tail = selectedState.tail
    ? applyTransform(born.tail, transform)
    : born.tail

  return {
    ...born,
    head,
    tail,
  }
}

export function posedTransform(born: Born, transforms: Transform[]): Born {
  const convoluted = convolutePoseTransforms(transforms)
  const head = applyTransform(
    born.head,
    getTransform({ translate: convoluted.translate })
  )
  const tail = applyTransform(
    born.tail,
    getTransform({ ...convoluted, origin: born.head })
  )

  return {
    ...born,
    head,
    tail,
    transform: getTransform(),
  }
}

export function extrudeFromParent(parent: Born, fromHead = false): Born {
  const head = fromHead ? parent.head : parent.tail
  return getBorn(
    {
      head,
      tail: head,
      parentId: fromHead ? parent.parentId : parent.id,
      connected: fromHead ? parent.connected : true,
    },
    true
  )
}

export function findBorn(borns: Born[], id: string): Born | undefined {
  return borns.find((b) => b.id === id)
}

export function findChildren(
  armature: Armature,
  id: string,
  onlyConnected = false
): Born[] {
  return armature.borns.filter(
    (b) => b.parentId === id && (!onlyConnected || b.connected)
  )
}

export function adjustConnectedPosition(borns: Born[]): Born[] {
  return borns.map((b) => {
    if (!b.connected) return b
    return {
      ...b,
      head: b.connected ? findBorn(borns, b.parentId)?.tail ?? b.head : b.head,
    }
  })
}

export function selectBorn(
  armature: Armature,
  id: string,
  selectedState: BornSelectedState,
  ignoreConnection = false
): IdMap<Partial<BornSelectedState>> {
  const target = findBorn(armature.borns, id)
  if (!target) return {}

  let ret: IdMap<Partial<BornSelectedState>> = {
    [id]: selectedState,
  }

  if (!ignoreConnection) {
    if (selectedState.head && target.connected) {
      const parent = findBorn(armature.borns, target.parentId)
      if (parent) {
        ret = {
          ...selectBorn(armature, parent.id, { tail: true }, ignoreConnection),
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

export function fixConnection(borns: Born[], b: Born): Born {
  if (!b.connected) return b

  const parent = findBorn(borns, b.parentId)
  if (!parent) return { ...b, connected: false, parentId: '' }

  return { ...b, head: parent.tail }
}
export function fixConnections(borns: Born[]): Born[] {
  return borns.map((b) => fixConnection(borns, b))
}

export function updateConnections(borns: Born[]): IdMap<Partial<Born>> {
  return borns.reduce<IdMap<Partial<Born>>>((p, b) => {
    const parent = findBorn(borns, b.parentId)
    if (!parent) {
      if (b.connected) p[b.id] = { connected: false, parentId: '' }
    } else if (b.connected) {
      p[b.id] = { connected: isSame(parent.tail, b.head) }
    }
    return p
  }, {})
}

export function getSelectedBornsOrigin(
  bornMap: IdMap<Born>,
  selectedState: IdMap<BornSelectedState>
): IVec2 {
  const selectedPoints = Object.keys(selectedState)
    .map((id) => {
      const selected = []
      const posed = posedTransform(bornMap[id], [bornMap[id].transform])
      if (selectedState[id].head) selected.push(posed.head)
      if (selectedState[id].tail) selected.push(posed.tail)
      return selected
    })
    .flat()

  return getPolygonCenter(selectedPoints)
}

export function getPosedBornHeadsOrigin(bornMap: IdMap<Born>): IVec2 {
  const points = Object.keys(bornMap).map(
    (id) => posedTransform(bornMap[id], [bornMap[id].transform]).head
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
      if (!b.parentId) {
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

interface BornNode extends Born, TreeNode {
  children: BornNode[]
}

export function getTransformedBornMap(bornMap: IdMap<Born>): IdMap<Born> {
  return toMap(flatBornTree(getTransformBornTree(bornMap)))
}

function getTransformBornTree(bornMap: IdMap<Born>): BornNode[] {
  return (getTree<Born>(bornMap) as BornNode[]).map((b) => {
    return { ...b, children: getChildTransforms(b) }
  })
}

function getChildTransforms(parent: BornNode): BornNode[] {
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

export function extendTransform(parent: Born, child: Born): Born {
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

function flatBornTree(children: BornNode[]): Born[] {
  return children
    .map((b) => {
      const { children, ...born } = b
      return born
    })
    .concat(children.flatMap((c) => flatBornTree(c.children)))
}

export function getAnySelectedBorns(
  bornMap: IdMap<Born>,
  selectedState: IdMap<BornSelectedState>
): IdMap<Born> {
  return dropMapIfFalse(bornMap, (b) => isBornSelected(selectedState[b.id]))
}

export function getAllSelectedBorns(
  bornMap: IdMap<Born>,
  selectedState: IdMap<BornSelectedState>
): IdMap<Born> {
  return dropMapIfFalse(bornMap, (b) =>
    isBornSelected(selectedState[b.id], true)
  )
}

export function getPoseSelectedBorns(
  bornMap: IdMap<Born>,
  selectedState: IdMap<BornSelectedState>
): IdMap<Born> {
  return toMap(
    filterPoseSelectedBorn(getTree(bornMap) as BornNode[], selectedState)
  )
}

function filterPoseSelectedBorn(
  bornTree: BornNode[],
  selectedState: IdMap<BornSelectedState>
): Born[] {
  return bornTree.flatMap((node) => {
    if (isBornSelected(selectedState[node.id])) {
      const { children, ...born } = node
      return [born]
    } else {
      return filterPoseSelectedBorn(node.children, selectedState)
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

export function duplicateBorns(srcBorns: IdMap<Born>, names: string[]): Born[] {
  const duplicatedIdMap = mapReduce(srcBorns, () => v4())
  return toList(
    mapReduce(srcBorns, (src) => {
      // switch new parent if current parent is duplicated together
      const parentId = duplicatedIdMap[src.parentId] ?? src.parentId
      // connect if current parent is duplicated together
      const connected = src.connected && !!duplicatedIdMap[src.parentId]
      const b = getBorn({
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
