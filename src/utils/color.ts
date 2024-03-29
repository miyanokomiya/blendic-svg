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

import { getCenter, circleClamp, clamp } from 'okageo'
import { useMapCache } from '/@/composables/cache'
import { getTransform, Transform } from '/@/models'
import { logRound } from '/@/utils/geometry'

export interface RGBA {
  r: number // 0 ~ 255
  g: number // 0 ~ 255
  b: number // 0 ~ 255
  a: number // 0 ~ 1
}

export interface HSLA {
  h: number // 0 ~ 360
  s: number // 0 ~ 1
  l: number // 0 ~ 1
  a: number // 0 ~ 1
}

export interface HSVA {
  h: number // 0 ~ 360
  s: number // 0 ~ 1
  v: number // 0 ~ 1
  a: number // 0 ~ 1
}

export function parseHSLA(str: string): HSLA | undefined {
  const splited = str.replace(/ /g, '').match(/hsla\((.+),(.+)%,(.+)%,(.+)\)/)
  if (!splited || splited.length < 5) return
  return {
    h: clamp(0, 360, parseFloat(splited[1])),
    s: clamp(0, 1, parseFloat(splited[2]) / 100),
    l: clamp(0, 1, parseFloat(splited[3]) / 100),
    a: clamp(0, 1, parseFloat(splited[4])),
  }
}

export function parseHSVA(str: string): HSVA | undefined {
  const splited = str.replace(/ /g, '').match(/hsva\((.+),(.+)%,(.+)%,(.+)\)/)
  if (!splited || splited.length < 5) return
  return {
    h: clamp(0, 360, parseFloat(splited[1])),
    s: clamp(0, 1, parseFloat(splited[2]) / 100),
    v: clamp(0, 1, parseFloat(splited[3]) / 100),
    a: clamp(0, 1, parseFloat(splited[4])),
  }
}

export function parseRGBA(str: string): RGBA | undefined {
  const splited = str.replace(/ /g, '').match(/rgba\((.+),(.+),(.+),(.+)\)/)
  if (!splited || splited.length < 5) return
  return {
    r: clamp(0, 255, parseFloat(splited[1])),
    g: clamp(0, 255, parseFloat(splited[2])),
    b: clamp(0, 255, parseFloat(splited[3])),
    a: clamp(0, 1, parseFloat(splited[4])),
  }
}

export function rednerHSLA(hsla: HSLA): string {
  return `hsla(${hsla.h},${hsla.s * 100}%,${hsla.l * 100}%,${hsla.a})`
}

export function rednerHSVA(hsva: HSVA): string {
  return `hsva(${hsva.h},${hsva.s * 100}%,${hsva.v * 100}%,${hsva.a})`
}

export function rednerRGBA(rgba: RGBA): string {
  return `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`
}

const rednerRGBByHSVCache = useMapCache<HSVA, string>(
  (hsva) => `${hsva.h},${hsva.s}${hsva.v}`,
  (hsva) => {
    const rgba = hsvaToRgba(hsva)
    return `rgb(${logRound(-1, rgba.r)},${logRound(-1, rgba.g)},${logRound(
      -1,
      rgba.b
    )})`
  }
)

export function rednerRGBByHSV(hsva: HSVA): string {
  return rednerRGBByHSVCache.getValue(hsva)
}

export function rgbaToHsva(rgba: RGBA): HSVA {
  const r = rgba.r / 255
  const g = rgba.g / 255
  const b = rgba.b / 255

  const v = Math.max(r, g, b)
  const c = v - Math.min(r, g, b)
  const h =
    c === 0
      ? c
      : v === r
        ? (g - b) / c
        : v === g
          ? 2 + (b - r) / c
          : 4 + (r - g) / c
  return {
    h: clamp(0, 360, 60 * (h < 0 ? h + 6 : h)),
    s: clamp(0, 1, v === 0 ? v : c / v),
    v: clamp(0, 1, v),
    a: rgba.a,
  }
}

function getHsvToRgbParam(h: number, s: number, v: number, n: number) {
  const k = (n + h / 60) % 6
  return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)
}

export function hsvaToRgba(hsva: HSVA): RGBA {
  const h = circleClamp(0, 360, hsva.h)
  return {
    r: clamp(0, 1, getHsvToRgbParam(h, hsva.s, hsva.v, 5)) * 255,
    g: clamp(0, 1, getHsvToRgbParam(h, hsva.s, hsva.v, 3)) * 255,
    b: clamp(0, 1, getHsvToRgbParam(h, hsva.s, hsva.v, 1)) * 255,
    a: hsva.a,
  }
}

export function hslaToHsva(hsla: HSLA): HSVA {
  const sv = slToSv(hsla.s, hsla.l)
  return {
    h: hsla.h,
    s: sv.s,
    v: sv.v,
    a: hsla.a,
  }
}

export function hsvaToHsla(hsva: HSVA): HSLA {
  const sl = svToSl(hsva.s, hsva.v)
  return {
    h: hsva.h,
    s: sl.s,
    l: sl.l,
    a: hsva.a,
  }
}

function svToSl(s: number, v: number): { s: number; l: number } {
  const l = ((2 - s) * v) / 2
  const ss =
    l === 0
      ? s
      : l === 1
        ? 0
        : l < 0.5
          ? (s * v) / (l * 2)
          : (s * v) / (2 - l * 2)

  return { s: ss, l }
}

function slToSv(s: number, l: number): { s: number; v: number } {
  const v = l + s * Math.min(l, 1 - l)
  const ss = v === 0 ? 0 : 2 * (1 - l / v)
  return { s: ss, v }
}

export function hsvaToTransform(hsva: HSVA): Transform {
  return getTransform({
    translate: { x: hsva.s * 100, y: hsva.v * 100 },
    rotate: hsva.h,
    scale: { x: hsva.a, y: 1 },
  })
}

export function getCenterColor(a: Transform, b: Transform): Transform {
  return getTransform({
    translate: getCenter(a.translate, b.translate),
    rotate: (a.rotate + b.rotate) / 2,
    scale: { x: (a.scale.x + b.scale.x) / 2, y: 1 },
  })
}
