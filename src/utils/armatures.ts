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
  return getBorn({
    head,
    tail: head,
    parentKey: fromHead ? parent.parentKey : parent.name,
    connected: fromHead ? parent.connected : true,
  })
}

export function findBorn(borns: Born[], name: string): Born | undefined {
  return borns.find((b) => b.name === name)
}

export function findChildren(
  armature: Armature,
  name: string,
  onlyConnected = false
): Born[] {
  return armature.borns.filter(
    (b) => b.parentKey === name && (!onlyConnected || b.connected)
  )
}

export function adjustConnectedPosition(borns: Born[]): Born[] {
  return borns.map((b) => {
    if (!b.connected) return b
    return {
      ...b,
      head: b.connected ? findBorn(borns, b.parentKey)?.tail ?? b.head : b.head,
    }
  })
}

export function selectBorn(
  armature: Armature,
  name: string,
  selectedState: BornSelectedState
): {
  [name: string]: Partial<BornSelectedState>
} {
  const target = findBorn(armature.borns, name)
  if (!target) return {}

  let ret: { [name: string]: Partial<BornSelectedState> } = {
    [name]: selectedState,
  }

  if (selectedState.head && target.connected) {
    const parent = findBorn(armature.borns, target.parentKey)
    if (parent) {
      ret = {
        ...selectBorn(armature, parent.name, { tail: true }),
        ...ret,
      }
    }
  }
  if (selectedState.tail) {
    findChildren(armature, target.name, true).forEach((b) => {
      ret[b.name] = { head: true }
    })
  }

  return ret
}

export function fixConnections(borns: Born[]): Born[] {
  return borns.map((b) => {
    if (!b.connected) return b

    const parent = findBorn(borns, b.parentKey)
    if (!parent) return { ...b, connected: false, parentKey: '' }

    return { ...b, head: parent.tail }
  })
}

export function updateConnections(borns: Born[]): Born[] {
  return borns.map((b) => {
    if (!b.connected) return b

    const parent = findBorn(borns, b.parentKey)
    if (!parent) return { ...b, connected: false, parentKey: '' }

    return { ...b, connected: isSame(parent.tail, b.head) }
  })
}
