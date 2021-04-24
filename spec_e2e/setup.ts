import { spawn, execSync } from 'child_process'

module.exports = () => {
  execSync('yarn build')
  ;(global as any).__server__ = spawn('yarn', ['serve', '--port', '3333'])
}
