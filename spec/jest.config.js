const { compilerOptions } = require('../tsconfig')

module.exports = {
  setupFiles: ['./setup.js'],
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/../'],
  modulePaths: ['<rootDir>/../'],
  moduleNameMapper: {
    ...Object.entries(compilerOptions.paths).reduce((p, [key, value]) => {
      p[key.replace('*', '(.*)$')] = value.map(
        (v) => `<rootDir>/../${v.replace('*', '$1')}`
      )
      return p
    }, {}),
    // https://jestjs.io/docs/28.x/upgrading-to-jest28#packagejson-exports
    '^nanoid$': require.resolve('nanoid'),
    // https://github.com/vuejs/vue-test-utils/issues/1975#issue-1245173573
    '^@vue/test-utils$': require.resolve('@vue/test-utils'),
  },
  moduleFileExtensions: ['ts', 'js', 'vue'],
  transform: {
    '^.+\\.ts$': '@swc/jest',
    '^.+\\.vue$': '@vue/vue3-jest',
  },
  globals: {
    NODE_ENV: 'test',
  },
  testMatch: ['<rootDir>/**/*.spec.ts'],
}
