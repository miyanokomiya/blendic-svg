import { reactive } from 'vue'

const settings = reactive({
  selectedColor: 'orange',
  historyMax: 64,
})

export function useSettings() {
  return { settings }
}
