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
} from 'okageo'

export function convoluteTransforms(transforms: Transform[]): Transform {
  return transforms.reduce((ret, t) => {
    return {
      ...ret,
      scale: { x: ret.scale.x * t.scale.x, y: ret.scale.y * t.scale.y },
      translate: add(add(ret.translate, t.translate), {
        x: t.origin.x * (1 - t.scale.x),
        y: t.origin.y * (1 - t.scale.y),
      }),
    }
  }, getTransform())
}

function scale(p: IVec2, scale: IVec2, origin: IVec2): IVec2 {
  return {
    x: origin.x + (p.x - origin.x) * scale.x,
    y: origin.y + (p.y - origin.y) * scale.y,
  }
}

export function editTransform(
  born: Born,
  transforms: Transform[],
  selectedState: BornSelectedState
) {
  const convoluted = convoluteTransforms(transforms)
  const head = selectedState.head
    ? add(
        scale(born.head, convoluted.scale, convoluted.origin),
        convoluted.translate
      )
    : born.head
  const tail = selectedState.tail
    ? add(
        scale(born.tail, convoluted.scale, convoluted.origin),
        convoluted.translate
      )
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
  selectedState: BornSelectedState
): IdMap<Partial<BornSelectedState>> {
  const target = findBorn(armature.borns, id)
  if (!target) return {}

  let ret: IdMap<Partial<BornSelectedState>> = {
    [id]: selectedState,
  }

  if (selectedState.head && target.connected) {
    const parent = findBorn(armature.borns, target.parentId)
    if (parent) {
      ret = {
        ...selectBorn(armature, parent.id, { tail: true }),
        ...ret,
      }
    }
  }
  if (selectedState.tail) {
    findChildren(armature, target.id, true).forEach((b) => {
      ret[b.id] = { head: true }
    })
  }

  return ret
}

export function fixConnections(borns: Born[]): Born[] {
  return borns.map((b) => {
    if (!b.connected) return b

    const parent = findBorn(borns, b.parentId)
    if (!parent) return { ...b, connected: false, parentId: '' }

    return { ...b, head: parent.tail }
  })
}

export function updateConnections(borns: Born[]): Born[] {
  return borns.map((b) => {
    const parent = findBorn(borns, b.parentId)
    if (!parent) return { ...b, connected: false, parentId: '' }
    if (!b.connected) return b
    return { ...b, connected: isSame(parent.tail, b.head) }
  })
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

export function getSelectedBornsOrigin(
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
