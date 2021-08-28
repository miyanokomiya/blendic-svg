const { pathsToModuleNameMapper } = require('ts-jest/utils')
const { compilerOptions } = require('../tsconfig')

module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/../'],
  modulePaths: ['<rootDir>/../'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/../',
  }),

  moduleFileExtensions: ['ts', 'js', 'vue'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.vue$': 'vue3-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      babelConfig: true,
    },
    NODE_ENV: 'test',
  },
  testMatch: ['<rootDir>/**/*.spec.ts'],
}
