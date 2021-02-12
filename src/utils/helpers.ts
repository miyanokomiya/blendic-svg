import { IVec2, Transform } from '../models/index'

export function transform(transform: Transform): string {
  return [
    `scale(${transform.scale.x},${transform.scale.y})`,
    `rotate(${transform.rotate})`,
    `translate(${transform.translate.x},${transform.translate.y})`,
  ].join(' ')
}

export function d(points: IVec2[], closed = false): string {
  if (points.length === 0) return ''

  const [head, ...body] = points
  return (
    `M${head.x},${head.y}` +
    body.map((p) => `L${p.x},${p.y}`).join('') +
    (closed ? 'z' : '')
  )
}
