import { reactive } from 'vue'
import { Action, Actor, Armature } from '../models'
import { useStore } from '../store'
import { useAnimationStore } from '../store/animation'
import { useCanvasStore } from '../store/canvas'
import { useElementStore } from '../store/element'
import { useHistoryStore } from '../store/history'
import { cleanActions } from '../utils/animations'
import { parseFromSvg } from '../utils/elements'

interface Root {
  armatures: Armature[]
  actions: Action[]
  actors: Actor[]
}

export function useStrage() {
  const store = useStore()
  const animationStore = useAnimationStore()
  const historyStore = useHistoryStore()
  const canvasStore = useCanvasStore()
  const elementStore = useElementStore()

  const state = reactive({
    currentFileName: 'blendic.json',
  })

  function serialize(): string {
    const armatures = store.state.armatures
    const actions = cleanActions(animationStore.actions.value, armatures)
    const actors = elementStore.actors.value
    const root: Root = { armatures, actions, actors }
    return JSON.stringify(root)
  }
  function deserialize(src: string) {
    try {
      const root: Root = JSON.parse(src)
      historyStore.clearHistory()
      canvasStore.initState()
      store.initState(root.armatures)
      animationStore.initState(root.actions)
      elementStore.initState(root.actors)
    } catch (e) {
      alert('Failed to load: Invalid file.')
    }
  }

  async function loadProjectFile() {
    try {
      const file = await showOpenFileDialog()
      const json = await readAsText(file)
      deserialize(json)
      state.currentFileName = file.name
    } catch (e) {
      alert('Failed to load: Invalid file.')
    }
  }

  async function saveProjectFile() {
    const json = serialize()
    saveJson(json, state.currentFileName)
  }

  async function loadSvgFile() {
    try {
      const file = await showOpenFileDialog('.svg, image/svg+xml')
      const svg = await readAsText(file)
      const actor = parseFromSvg(svg)
      elementStore.initState([actor])
    } catch (e) {
      alert('Failed to load: Invalid file.')
    }
  }

  return {
    loadProjectFile,
    saveProjectFile,
    loadSvgFile,
  }
}

function saveJson(json: string, filename: string) {
  saveFileInWeb(
    URL.createObjectURL(new Blob([json], { type: 'text/plain' })),
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
