import { reactive } from 'vue'

const settings = reactive({
  selectedColor: 'orange',
})

export function useSettings() {
  return { settings }
}
