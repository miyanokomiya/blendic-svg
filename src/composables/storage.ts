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

import { ElementNode, ElementNodeAttributes, IdMap, toMap } from '../models'
import { useStore } from '../store'
import { useAnimationStore } from '../store/animation'
import { useCanvasStore } from '../store/canvas'
import { useElementStore } from '../store/element'
import { useHistoryStore } from '../store/history'
import {
  cleanActions,
  getKeyframeMapByTargetId,
  getLastFrame,
} from '../utils/animations'
import {
  cleanActors,
  cleanGraphs,
  inheritWeight,
  parseFromSvg,
  resolveAnimationGraph,
} from '../utils/elements'
import {
  addEssentialSvgAttributes,
  bakeKeyframes,
  getGraphResolvedElementTree,
  getPosedElementTree,
} from '../utils/poseResolver'
import { initialize, StorageRoot } from '/@/models/storage'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import { makeSvg } from '/@/utils/svgMaker'

interface BakedData {
  // data format version (not same as app version)
  version: string
  appVersion: string
  actions: {
    name: string
    attributesMapPerFrame: IdMap<ElementNodeAttributes>[]
  }[]
  svgTree: ElementNode
}

const fileSystemEnable = 'showOpenFilePicker' in window
const defaultProjectFileName = 'blendic.json'
let fileHandle: FileHandle | undefined = undefined

export function useStorage() {
  const store = useStore()
  const animationStore = useAnimationStore()
  const historyStore = useHistoryStore()
  const canvasStore = useCanvasStore()
  const elementStore = useElementStore()
  const graphStore = useAnimationGraphStore()

  function serialize(): string {
    const { armatures, bones } = store.exportState()
    const actions = cleanActions(animationStore.actions.value, armatures, bones)
    const actors = cleanActors(elementStore.actors.value, armatures, bones)
    const graphs = cleanGraphs(graphStore.graphList.value)
    const root: StorageRoot = { armatures, bones, actions, actors, graphs }
    return JSON.stringify(root)
  }
  function deserialize(src: string) {
    try {
      const root: StorageRoot = initialize(JSON.parse(src))
      historyStore.clearHistory()
      canvasStore.initState()
      store.initState(root.armatures, root.bones)
      animationStore.initState(root.actions)
      elementStore.initState(root.actors)
      graphStore.initState(root.graphs)
    } catch (e) {
      alert('Failed to load: Invalid file.')
    }
  }

  async function loadProjectFile() {
    let json: string | undefined = undefined
    try {
      if (fileSystemEnable) {
        const result = await readFile()
        // the user cancelled
        if (!result) return

        fileHandle = result.handle
        json = result.content
      } else {
        const file = await showOpenFileDialog()
        json = await readAsText(file)
      }
    } catch (e) {
      alert('Failed to open a file.')
    }

    if (!json) return
    try {
      deserialize(json)
    } catch (e) {
      fileHandle = undefined
      alert('Failed to load: Invalid file.')
    }
  }

  async function saveProjectFile() {
    const json = serialize()
    saveJson(json, fileHandle?.name ?? defaultProjectFileName)
  }

  async function overrideProjectFile() {
    const json = serialize()
    if (fileHandle) {
      await overrideFile(fileHandle, json)
    } else if (fileSystemEnable) {
      fileHandle = await writeFile(json)
    } else {
      saveJson(json, defaultProjectFileName)
    }
  }

  async function loadSvgFile(isInheritWeight = false) {
    try {
      const file = await showOpenFileDialog('.svg, image/svg+xml')
      const svg = await readAsText(file)
      const actor = parseFromSvg(svg)

      if (isInheritWeight && elementStore.lastSelectedActor.value) {
        elementStore.importActor(
          inheritWeight(elementStore.lastSelectedActor.value, actor)
        )
      } else {
        elementStore.importActor(actor)
      }
    } catch (e) {
      alert('Failed to load: Invalid file.')
    }
  }

  function bakeAction(actionIds: string[]) {
    const armature = store.lastSelectedArmature.value
    const actor = elementStore.lastSelectedActor.value
    if (!armature || !actor) return

    const svgTree = addEssentialSvgAttributes(actor.svgTree)
    const actionMap = animationStore.actionMap.value
    const actions = actionIds
      .filter((id) => actionMap[id])
      .map((id) => {
        const action = actionMap[id]
        const attributesMapPerFrame = bakeKeyframes(
          getKeyframeMapByTargetId(action.keyframes),
          store.boneMap.value,
          toMap(actor.elements),
          svgTree,
          getLastFrame(action.keyframes)
        )
        return {
          name: action.name,
          attributesMapPerFrame,
        }
      })

    const data: BakedData = {
      version: '1.0.0',
      appVersion: process.env.APP_VERSION ?? 'dev',
      actions,
      svgTree,
    }

    saveJson(
      JSON.stringify(data),
      actions.map((a) => a.name).join('_') + '.json'
    )
  }

  function bakeSvg() {
    const actor = elementStore.lastSelectedActor.value
    if (!actor) return

    const action = animationStore.selectedAction.value
    const graph = graphStore.lastSelectedGraph.value

    const name = [action?.name, graph?.name].filter((n) => !!n).join('_')

    const svgNode = addEssentialSvgAttributes(
      getPosedElementTree(
        animationStore.currentPosedBones.value,
        toMap(actor.elements ?? []),
        actor.svgTree
      )
    )

    const graphObjectMap = resolveAnimationGraph(
      elementStore.elementMap.value,
      {
        currentFrame: animationStore.currentFrame.value,
        endFrame: animationStore.endFrame.value,
      },
      graphStore.nodeMap.value
    )

    saveSvg(
      makeSvg(getGraphResolvedElementTree(graphObjectMap, svgNode)).outerHTML,
      `${name}.svg`
    )
  }

  return {
    fileSystemEnable,
    loadProjectFile,
    saveProjectFile,
    overrideProjectFile,
    loadSvgFile,
    bakeAction,
    bakeSvg,
  }
}

function saveJson(json: string, filename: string) {
  saveFileInWeb(
    URL.createObjectURL(new Blob([json], { type: 'text/plain' })),
    filename
  )
}

function saveSvg(svg: string, filename: string) {
  saveFileInWeb(
    URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })),
    filename
  )
}

function saveFileInWeb(file: string, filename: string) {
  const a = document.createElement('a')
  a.href = file
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function showOpenFileDialog(accept = '.json, application/json'): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = (event) => {
      const target = event?.target as any
      if (target?.files) {
        resolve(target.files[0])
      } else {
        reject()
      }
    }
    input.click()
  })
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

interface FileHandle {
  name: string
  size: number
  lastModified: number
  getFile(): Promise<{ text(): Promise<string> }>
  createWritable(): Promise<{
    write(content: string): Promise<void>
    close(): Promise<void>
  }>
}

interface FileHandleOptions {
  types: [
    {
      description: string
      accept: {
        [mime: string]: string[]
      }
    }
  ]
}

const jsonOptions: FileHandleOptions = {
  types: [
    {
      description: 'JSON File',
      accept: {
        'text/plain': ['.json'],
      },
    },
  ],
}

async function getFileOpenHandle(
  options: FileHandleOptions
): Promise<FileHandle | undefined> {
  try {
    const [handle] = await (window as any).showOpenFilePicker(options)
    return handle
  } catch (e) {
    // ignore the error caused by aborting a request
    if (e instanceof Error && e.message?.includes('aborted')) return
    throw e
  }
}

async function getFileSaveHandle(
  options: FileHandleOptions
): Promise<FileHandle | undefined> {
  try {
    const handle = await (window as any).showSaveFilePicker({
      ...options,
      suggestedName: defaultProjectFileName,
    })
    return handle
  } catch (e) {
    // ignore the error caused by aborting a request
    if (e instanceof Error && e.message?.includes('aborted')) return
    throw e
  }
}

async function readFile(): Promise<
  { handle: FileHandle; content: string } | undefined
> {
  const handle = await getFileOpenHandle(jsonOptions)
  if (!handle) return

  const file = await handle.getFile()
  const content = await file.text()
  return { handle, content }
}

async function writeFile(content: string): Promise<FileHandle | undefined> {
  const handle = await getFileSaveHandle(jsonOptions)
  if (!handle) return

  await overrideFile(handle, content)
  return handle
}

async function overrideFile(handle: FileHandle, content: string) {
  try {
    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
  } catch (e) {
    // ignore the error caused by not allowing
    if (e instanceof Error && e.message?.includes('not allowed')) return
    throw e
  }
}
