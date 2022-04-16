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

interface CopyDataSet {
  'text/plain': string
  [key: string]: any
}

export interface StringItem {
  kind: 'string'
  type: string
  getAsString: () => Promise<string>
}

export interface FileItem {
  kind: 'file'
  type: string
  getAsFile: () => Promise<File>
}

export function useClipboard(
  generateCopyDataSet: () => CopyDataSet,
  handlePastedItems: (items: Array<StringItem | FileItem>) => void
) {
  function onCopy(e: ClipboardEvent) {
    if (!e.clipboardData) return

    Object.entries(generateCopyDataSet()).forEach(([type, data]) =>
      e.clipboardData!.setData(type, data)
    )
    e.preventDefault()
  }

  function onPaste(e: ClipboardEvent) {
    if (!e.clipboardData) return

    const items = Array.from(e.clipboardData.items).map(createItem)
    if (items.length > 0) {
      handlePastedItems(items)
    }
    e.preventDefault()
  }

  return {
    onCopy,
    onPaste,
  }
}

function createItem(item: DataTransferItem): StringItem | FileItem {
  return item.kind === 'string'
    ? {
        kind: 'string',
        type: item.type,
        getAsString: () => getAsString(item),
      }
    : {
        kind: 'file',
        type: item.type,
        getAsFile: () => getAsFile(item),
      }
}

function getAsString(item: DataTransferItem): Promise<string> {
  if (item.kind === 'string') {
    return new Promise((resolve) => {
      item.getAsString(resolve)
    })
  } else {
    return Promise.reject(`Can not read "${item.kind}" as string`)
  }
}

function getAsFile(item: DataTransferItem): Promise<File> {
  if (item.kind === 'file') {
    const file = item.getAsFile()
    return file
      ? Promise.resolve(file)
      : Promise.reject('Failed to read read the file')
  } else {
    return Promise.reject(`Can not read "${item.kind}" as file`)
  }
}

export function generateClipboardData<T extends string, K>(type: T, data: K) {
  return {
    app: 'blendic-svg',
    appVersion: process.env.APP_VERSION ?? 'dev',
    type,
    data,
  }
}

interface ClipboardData<T extends string, K> {
  app: 'blendic-svg'
  appVersion: string
  type: T
  data: K
}

export function useClipboardSerializer<T extends string, K>(
  type: T
): {
  serialize: (data: K) => string
  deserialize: (text: string) => K
} {
  return {
    serialize(data: K): string {
      return JSON.stringify({
        app: 'blendic-svg',
        appVersion: process.env.APP_VERSION ?? 'dev',
        type,
        data,
      })
    },
    /**
     * @throws {Error}
     */
    deserialize(text: string) {
      const json = JSON.parse(text) as ClipboardData<T, K>
      if (json.app !== 'blendic-svg' || json.type !== type)
        throw new Error('Invalid data')

      return json.data
    },
  }
}
