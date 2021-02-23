import { reactive } from 'vue'

const settings = reactive({
  selectedColor: 'orange',
  historyMax: 64,
  showBornName: true,
})

export function useSettings() {
  return { settings }
}
