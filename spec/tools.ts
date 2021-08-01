import { IVec2 } from 'okageo'
import { Bone, Transform } from '/@/models'

export function assertVec(a: IVec2, b: IVec2) {
  expect(a.x).toBeCloseTo(b.x)
  expect(a.y).toBeCloseTo(b.y)
}

export function assertTransform(a: Transform, b: Transform) {
  expect(a.rotate).toBeCloseTo(b.rotate)
  assertVec(a.translate, b.translate)
  assertVec(a.scale, b.scale)
  assertVec(a.origin, b.origin)
}

export function assertBoneGeometry(a: Bone, b: Bone) {
  assertVec(a.head, b.head)
  assertVec(a.tail, b.tail)
  assertTransform(a.transform, b.transform)
}
