import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import {
  BaseElementNode,
  DirectiveNode,
  SimpleExpressionNode,
} from '@vue/compiler-core'

const TEST_PREFIX = 'data-test'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          nodeTransforms: [
            (node: any) => {
              if (process.env.E2E === '1') return
              if (!Array.isArray(node.props)) return

              node.props = (node as BaseElementNode).props.filter((p) => {
                switch (p.type) {
                  case 6:
                    return !p.name.startsWith(TEST_PREFIX)
                  case 7: {
                    const dir = p as DirectiveNode
                    if (!dir.arg) return true
                    if (dir.arg.type !== 4) return true
                    return !(
                      dir.arg as SimpleExpressionNode
                    ).content.startsWith(TEST_PREFIX)
                  }
                  default:
                    return true
                }
              })
            },
          ],
        },
      },
    }),
  ],
  resolve: {
    alias: [{ find: '/@', replacement: path.resolve(__dirname, 'src') }],
  },
  base: process.env.BASE_PATH || '/',
  define: {
    'process.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
  },
})
