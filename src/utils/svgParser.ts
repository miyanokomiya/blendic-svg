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

import { splitD } from 'okageo'

export function parsePathD(d: string) {
  const commands = splitD(d)
  return commands.map((c) => {
    const [command, values] = parseCommandSrc(c)
    validateCommandValues(command, values)
    switch (command) {
      case 'M':
      case 'm':
      case 'L':
      case 'l':
        return {
          command,
          p: { x: values[0], y: values[1] },
        }
      case 'H':
      case 'h':
        return { command, x: values[0] }
      case 'V':
      case 'v':
        return { command, y: values[0] }
      case 'Q':
      case 'q':
        return {
          command,
          c1: { x: values[0], y: values[1] },
          p: { x: values[2], y: values[3] },
        }
      case 'T':
      case 't':
        return {
          command,
          p: { x: values[0], y: values[1] },
        }
      case 'C':
      case 'c':
        return {
          command,
          c1: { x: values[0], y: values[1] },
          c2: { x: values[2], y: values[3] },
          p: { x: values[4], y: values[5] },
        }
      case 'S':
      case 's':
        return {
          command,
          c1: { x: values[0], y: values[1] },
          p: { x: values[2], y: values[3] },
        }
      case 'A':
      case 'a':
        return {
          command,
          rx: values[0],
          ry: values[1],
          rotate: values[2],
          'large-arc': !!values[3],
          sweep: !!values[4],
          p: { x: values[5], y: values[6] },
        }
      case 'Z':
      case 'z':
        return { command }
      default:
        throw new Error(`Unknown command: ${c.join(' ')}`)
    }
  })
}

function parseCommandSrc(src: string[]): [command: string, values: number[]] {
  const [command, ...valuesSrc] = src
  const values = valuesSrc.map((v) => {
    const parsed = parseFloat(v)
    if (isNaN(parsed)) throw new Error(`Invalid command: ${src.join(' ')}`)
    return parsed
  })
  return [command, values]
}

function validateCommandValues(command: string, values: unknown[]): void {
  let length = -1
  switch (command) {
    case 'M':
    case 'm':
    case 'L':
    case 'l':
    case 'T':
    case 't':
      length = 2
      break
    case 'H':
    case 'h':
    case 'V':
    case 'v':
      length = 1
      break
    case 'Q':
    case 'q':
    case 'S':
    case 's':
      length = 4
      break
    case 'C':
    case 'c':
      length = 6
      break
    case 'A':
    case 'a':
      length = 7
      break
    case 'Z':
    case 'z':
      length = 0
      break
  }
  if (values.length !== length)
    throw new Error(`Unknown command: ${[command, ...values].join(' ')}`)
}
