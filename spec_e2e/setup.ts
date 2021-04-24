import { spawn, execSync } from 'child_process'

module.exports = () => {
  if (!process.env.E2E_SKIP_BUILD) {
    execSync('yarn build')
  }
  ;(global as any).__server__ = spawn('yarn', ['serve', '--port', '3333'])
}
