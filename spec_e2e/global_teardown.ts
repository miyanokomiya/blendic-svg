import treeKill from 'tree-kill'

module.exports = () => {
  treeKill((global as any).__server__.pid)
}
