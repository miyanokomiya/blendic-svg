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

Copyright (C) 2022, Tomoya Komiyama.
*/

interface KeywordDetection {
  from: number
  length: number
}

export interface KeywordSplit {
  text: string
  hit?: boolean
}

function detectKeyword(
  keyword: string,
  src: string
): KeywordDetection | undefined {
  const from = src.indexOf(keyword)
  return from === -1 ? undefined : { from, length: keyword.length }
}

export function splitByKeyword(keyword: string, src: string): KeywordSplit[] {
  const ret: KeywordSplit[] = []
  const lowerKeyword = keyword.toLowerCase()

  let current = src
  while (current.length > 0) {
    const info = detectKeyword(lowerKeyword, current.toLowerCase())
    if (!info) {
      ret.push({ text: current })
      break
    }

    if (info.from > 0) {
      ret.push({ text: current.slice(0, info.from) })
    }

    ret.push({
      text: current.slice(info.from, info.from + info.length),
      hit: true,
    })
    current = current.slice(info.from + info.length)
  }

  return ret
}
