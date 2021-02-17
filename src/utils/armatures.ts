import {
  Transform,
  Armature,
  Born,
  BornSelectedState,
  getTransform,
  getBorn,
  IdMap,
} from '../models/index'
import {
  add,
  getOuterRectangle,
  getRectCenter,
  isSame,
  IVec2,
  sub,
  multi,
  rotate,
} from 'okageo'

export function dissolveOrigin(t: Transform): Transform {
  const rad = (t.rotate / 180) * Math.PI
  const constant = sub(t.origin, rotate(scale(t.origin, t.scale), rad))
  return {
    ...t,
    translate: add(t.translate, constant),
    origin: { x: 0, y: 0 },
  }
}

export function multiTransform(a: Transform, b: Transform): Transform {
  const da = dissolveOrigin(a)
  const db = dissolveOrigin(b)
  return getTransform({
    scale: { x: da.scale.x * db.scale.x, y: da.scale.y * db.scale.y },
    rotate: da.rotate + db.rotate,
    translate: add(da.translate, db.translate),
  })
}

export function convoluteTransforms(transforms: Transform[]): Transform {
  return transforms.reduce((ret, t) => {
    return multiTransform(ret, t)
  }, getTransform())
}

export function multiPoseTransform(a: Transform, b: Transform): Transform {
  return getTransform({
    scale: { x: a.scale.x * b.scale.x, y: a.scale.y * b.scale.y },
    rotate: a.rotate + b.rotate,
    translate: add(a.translate, b.translate),
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

export function updateConnections(borns: Born[]): Born[] {
  return borns.map((b) => {
    const parent = findBorn(borns, b.parentId)
    if (!parent) return { ...b, connected: false, parentId: '' }
    if (!b.connected) return b
    return { ...b, connected: isSame(parent.tail, b.head) }
  })
}
export function _updateConnections(borns: Born[]): IdMap<Partial<Born>> {
  return borns.reduce<IdMap<Partial<Born>>>((p, b) => {
    const parent = findBorn(borns, b.parentId)
    if (!parent) {
      p[b.id] = { connected: false, parentId: '' }
    } else if (b.connected) {
      p[b.id] = { connected: isSame(parent.tail, b.head) }
    }
    return p
  }, {})
}

export function updateBornName(
  borns: Born[],
  from: string,
  to: string
): Born[] {
  return borns.map((b) => ({
    ...b,
    name: b.name === from ? to : b.name,
    parentId: b.parentId === from ? to : b.parentId,
  }))
}

export function getSelectedBornsBoundingOrigin(
  bornMap: IdMap<Born>,
  selectedState: IdMap<BornSelectedState>
): IVec2 {
  return getRectCenter(
    getOuterRectangle(
      Object.keys(selectedState).map((id) => {
        const selected = []
        if (selectedState[id].head) selected.push(bornMap[id].head)
        if (selectedState[id].tail) selected.push(bornMap[id].tail)
        return selected
      })
    )
  )
}

export function getSelectedBornsOrigin(
  bornMap: IdMap<Born>,
  selectedState: IdMap<BornSelectedState>,
  onlyHead = false
): IVec2 {
  const selectedPoints = Object.keys(selectedState)
    .map((id) => {
      const selected = []
      const posed = posedTransform(bornMap[id], [bornMap[id].transform])
      if (selectedState[id].head) selected.push(posed.head)
      if (!onlyHead && selectedState[id].tail) selected.push(posed.tail)
      return selected
    })
    .flat()

  if (selectedPoints.length === 0) return { x: 0, y: 0 }

  return multi(
    selectedPoints.reduce((p, c) => add(p, c), { x: 0, y: 0 }),
    1 / selectedPoints.length
  )
}
