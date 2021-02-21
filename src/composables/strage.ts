import { reactive } from 'vue'
import { Action, Armature } from '../models'
import { useStore } from '../store'
import { useAnimationStore } from '../store/animation'
import { useCanvasStore } from '../store/canvas'
import { useHistoryStore } from '../store/history'
import { cleanActions } from '../utils/animations'

interface Root {
  armatures: Armature[]
  actions: Action[]
}

export function useStrage() {
  const store = useStore()
  const animationStore = useAnimationStore()
  const historyStore = useHistoryStore()
  const canvasStore = useCanvasStore()

  const state = reactive({
    currentFileName: 'blendic.json',
  })

  function serialize(): string {
    const armatures = store.state.armatures
    const actions = cleanActions(animationStore.actions, armatures)
    const root: Root = { armatures, actions }
    return JSON.stringify(root)
  }
  function deserialize(src: string) {
    try {
      const root: Root = JSON.parse(src)
      historyStore.clearHistory()
      canvasStore.initState()
      store.initState(root.armatures)
      animationStore.initState(root.actions)
    } catch (e) {
      alert('Failed to load: Invalid file.')
    }
  }

  async function loadFile() {
    try {
      const file = await showOpenFileDialog()
      const json = await readAsText(file)
      deserialize(json)
      state.currentFileName = file.name
    } catch (e) {
      alert('Failed to load: Invalid file.')
    }
  }

  async function saveFile() {
    const json = serialize()
    saveJson(json, state.currentFileName)
  }

  return {
    loadFile,
    saveFile,
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

function showOpenFileDialog(): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json, application/json'
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
