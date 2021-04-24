module.exports = {
  testTimeout: 20000,
  globalSetup: './global_setup.ts',
  globalTeardown: './global_teardown.ts',
  modulePaths: ['<rootDir>/../'],
  moduleFileExtensions: ['ts', 'js'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      babelConfig: true,
    },
    NODE_ENV: 'test',
  },
  testMatch: ['**/*.spec.ts'],
}
