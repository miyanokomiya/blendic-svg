import {
  Transform,
  Armature,
  Born,
  BornSelectedState,
  getTransform,
  getBorn,
} from '../models/index'
import { add, isSame } from 'okageo'

function convoluteTransforms(transforms: Transform[]): Transform {
  return transforms.reduce((ret, t) => {
    return {
      ...ret,
      translate: add(ret.translate, t.translate),
    }
  }, getTransform())
}

export function editTransform(
  armature: Born,
  transforms: Transform[],
  selectedState: BornSelectedState
) {
  const convoluted = convoluteTransforms(transforms)
  const head = selectedState.head
    ? add(armature.head, convoluted.translate)
    : armature.head
  const tail = selectedState.tail
    ? add(armature.tail, convoluted.translate)
    : armature.tail

  return {
    ...armature,
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
): {
  [id: string]: Partial<BornSelectedState>
} {
  const target = findBorn(armature.borns, id)
  if (!target) return {}

  let ret: { [id: string]: Partial<BornSelectedState> } = {
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
    if (!b.connected) return b

    const parent = findBorn(borns, b.parentId)
    if (!parent) return { ...b, connected: false, parentId: '' }

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
