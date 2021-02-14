import { reactive } from 'vue'

const state = reactive({
  size: { width: 100, height: 100 },
})

window.addEventListener('resize', () => {
  state.size = {
    width: window.innerWidth,
    height: window.innerHeight,
  }
})

export function useWindow() {
  return { state }
}
