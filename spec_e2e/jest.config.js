module.exports = {
  testTimeout: 20000,
  globalSetup: './setup.ts',
  globalTeardown: './teardown.ts',
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
