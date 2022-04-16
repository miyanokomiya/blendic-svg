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

const ua = window.navigator.userAgent.toLowerCase()

function isMac(): boolean {
  return ua.indexOf('mac os x') !== -1
}

export function isCtrlOrMeta(e: MouseEvent | KeyboardEvent): boolean {
  return e.ctrlKey || e.metaKey
}

export function getCtrlOrMetaStr(): string {
  return isMac() ? 'Command' : 'Ctrl'
}

export function switchClick(
  e: MouseEvent,
  callbacks: { plain?: () => void; shift?: () => void; ctrl?: () => void }
) {
  if (isCtrlOrMeta(e)) {
    callbacks.ctrl?.()
  } else if (e.shiftKey) {
    callbacks.shift?.()
  } else {
    callbacks.plain?.()
  }
}

export type MouseOptions = { shift?: boolean; ctrl?: boolean }

export function getMouseOptions(e: MouseEvent): MouseOptions {
  return {
    shift: e.shiftKey,
    ctrl: isCtrlOrMeta(e),
  }
}

/**
 * When "key" is capital case, "shift" is true
 */
export type KeyOptions = { shift?: boolean; ctrl?: boolean; key: string }

export function getKeyOptions(e: KeyboardEvent): KeyOptions {
  return {
    key: e.key,
    shift: e.shiftKey,
    ctrl: isCtrlOrMeta(e),
  }
}

export function isCopyPasteKeyevent(option: KeyOptions): boolean {
  return (
    !option.shift && !!option.ctrl && (option.key === 'v' || option.key === 'c')
  )
}
