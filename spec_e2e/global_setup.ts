import { spawn, execSync } from 'child_process'

module.exports = () => {
  if (process.env.E2E_SKIP_BUILD !== '1') {
    execSync('E2E=1 yarn build')
  }
  ;(global as any).__server__ = spawn('yarn', ['serve', '--port', '3333'])
}
