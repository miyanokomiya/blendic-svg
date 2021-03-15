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

import { clamp } from '/@/utils/geometry'

export interface HSLA {
  h: number
  s: number
  l: number
  a: number
}

export interface HSVA {
  h: number
  s: number
  v: number
  a: number
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

export function rednerHSLA(hsla: HSLA): string {
  return `hsla(${hsla.h},${hsla.s * 100}%,${hsla.l * 100}%,${hsla.a})`
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

  if (l != 0) {
    if (l == 1) {
      s = 0
    } else if (l < 0.5) {
      s = (s * v) / (l * 2)
    } else {
      s = (s * v) / (2 - l * 2)
    }
  }

  return { s, l }
}

function slToSv(s: number, l: number): { s: number; v: number } {
  const v = l + s * Math.min(l, 1 - l)
  const ss = v === 0 ? 0 : 2 * (1 - l / v)
  return { s: ss, v }
}
