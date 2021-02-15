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

export function convoluteTransforms(transforms: Transform[]): Transform {
  return transforms.reduce((ret, t) => {
    const scaleConstant = {
      x: t.origin.x * (1 - t.scale.x),
      y: t.origin.y * (1 - t.scale.y),
    }
    const rotateConstant = sub(
      t.origin,
      rotate(t.origin, (t.rotate / 180) * Math.PI)
    )
    return {
      ...ret,
      scale: { x: ret.scale.x * t.scale.x, y: ret.scale.y * t.scale.y },
      rotate: ret.rotate + t.rotate,
      translate: add(
        add(add(ret.translate, t.translate), scaleConstant),
        rotateConstant
      ),
    }
  }, getTransform())
}

function scale(p: IVec2, scale: IVec2, origin: IVec2): IVec2 {
  return {
    x: origin.x + (p.x - origin.x) * scale.x,
    y: origin.y + (p.y - origin.y) * scale.y,
  }
}

function applyTransform(p: IVec2, transform: Transform): IVec2 {
  return add(
    rotate(
      scale(p, transform.scale, transform.origin),
      (transform.rotate / 180) * Math.PI
    ),
    transform.translate
  )
}

export function editTransform(
  born: Born,
  transforms: Transform[],
  selectedState: BornSelectedState
) {
  const convoluted = convoluteTransforms(transforms)
  const head = selectedState.head
    ? applyTransform(born.head, convoluted)
    : born.head
  const tail = selectedState.tail
    ? applyTransform(born.tail, convoluted)
    : born.tail

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
  selectedState: IdMap<BornSelectedState>
): IVec2 {
  const selectedPoints = Object.keys(selectedState)
    .map((id) => {
      const selected = []
      if (selectedState[id].head) selected.push(bornMap[id].head)
      if (selectedState[id].tail) selected.push(bornMap[id].tail)
      return selected
    })
    .flat()

  if (selectedPoints.length === 0) return { x: 0, y: 0 }

  return multi(
    selectedPoints.reduce((p, c) => add(p, c), { x: 0, y: 0 }),
    1 / selectedPoints.length
  )
}
