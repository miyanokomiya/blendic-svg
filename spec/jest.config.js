const { compilerOptions } = require('../tsconfig')

module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/../'],
  modulePaths: ['<rootDir>/../'],
  moduleNameMapper: Object.entries(compilerOptions.paths).reduce(
    (p, [key, value]) => {
      p[key.replace('*', '(.*)$')] = value.map(
        (v) => `<rootDir>/../${v.replace('*', '$1')}`
      )
      return p
    },
    {}
  ),
  moduleFileExtensions: ['ts', 'js', 'vue'],
  transform: {
    '^.+\\.ts$': '@swc/jest',
    '^.+\\.vue$': 'vue3-jest',
  },
  globals: {
    NODE_ENV: 'test',
  },
  testMatch: ['<rootDir>/**/*.spec.ts'],
}
